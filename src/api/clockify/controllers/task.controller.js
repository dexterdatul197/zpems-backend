const httpStatus = require('http-status');
const Task = require('../models/task.model');
const { executeSuiteQLQuery } = require('../../base/services/netsuite');

exports.list = async (req, res, next) => {
  try {
    const { clientInternalId, projectInternalId, sorting } = req.query;

    // filtering
    const queryOptions = {};
    if (clientInternalId) {
      queryOptions['client.internalId'] = clientInternalId;
    }
    if (projectInternalId) {
      queryOptions['project.internalId'] = projectInternalId;
    }

    // sorting
    const sortOptions = {};
    if (sorting) {
      const sortFields = sorting.split(',');
      sortFields.forEach((sortField) => {
        const sortOrder = sortField.startsWith('-') ? -1 : 1;
        const fieldName = sortField.replace(/^-/, '').replace(/-/, '.');
        sortOptions[fieldName] = sortOrder;
      });
    }

    const tasks = await Task.aggregate([
      {
        $lookup: {
          from: 'clockifyprojects',
          localField: 'projectInternalId',
          foreignField: 'internalId',
          as: 'project',
        },
      },
      {
        $unwind: '$project',
      },
      {
        $lookup: {
          from: 'clockifyclients',
          localField: 'project.clientInternalId',
          foreignField: 'internalId',
          as: 'client',
        },
      },
      {
        $unwind: {
          path: '$client',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: queryOptions,
      },
      {
        $lookup: {
          from: 'users',
          let: { assigneeIds: '$assigneeIds' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$internalId', '$$assigneeIds'],
                },
              },
            },
          ],
          as: 'assignees',
        },
      },
      {
        $sort: sortOptions,
      },
    ]);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { projectInternalId, name, description, assigneeIds } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(httpStatus.NOT_FOUND).end();
    }

    task.projectInternalId = projectInternalId;
    task.name = name;
    task.description = description;
    task.assigneeIds = assigneeIds;
    task.save();

    res.json(task);
  } catch (error) {
    next(error);
  }
};

exports.sync = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery(
      `SELECT projecttask.message as projecttask_message, projecttask.status as projecttask_status, projecttask.title as projecttask_name, projecttask.id as projecttask_id, job.id AS project_id, LISTAGG(projecttaskassignee.resource, ',') WITHIN GROUP (ORDER BY projecttaskassignee.resource) AS resources FROM projecttask LEFT JOIN projecttaskassignee ON projecttask.id = projecttaskassignee.projecttask LEFT JOIN job ON projecttask.project = job.id GROUP BY projecttask.id, projecttask.title, projecttask.status, projecttask.message, job.id`
    );
    const items = result.items || [];

    // iterate items and create/update tasks
    for (const item of items) {
      const task = await Task.findOne({ internalId: item.projecttask_id });
      if (task) {
        task['name'] = item['projecttask_name'];
        task['projectInternalId'] = item['project_id'];
        task['assigneeIds'] = item['resources'].split(',');
        task['description'] = item['projecttask_message'];
        await task.save();
      } else {
        await Task.create({
          name: item['projecttask_name'],
          internalId: item['projecttask_id'],
          projectInternalId: item['project_id'],
          assigneeIds: item['resources'].split(','),
          description: item['projecttask_message'],

          // TODO: add status field to Task model
          // status: item['projecttask_status'],
        });
      }
    }

    res.json({ message: `Synced ${items.length} tasks.` }).end();
  } catch (error) {
    next(error);
  }
};
