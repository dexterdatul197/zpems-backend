const httpStatus = require('http-status');
const Project = require('../models/project.model');
const Client = require('../models/client.model');
const { executeSuiteQLQuery } = require('../../base/services/netsuite');

exports.list = async (req, res, next) => {
  try {
    const { sorting } = req.query;

    // sorting
    const sortOptions = {};
    if (sorting) {
      const sortFields = sorting.split(',');
      sortFields.forEach((sortField) => {
        const sortOrder = sortField.startsWith('-') ? -1 : 1;
        const fieldName = sortField.replace(/^-/, '').replace(/-/, '.');
        sortOptions[fieldName] = sortOrder;
      });
    } else {
      sortOptions._id = 1;
    }

    const projects = await Project.aggregate([
      {
        $lookup: {
          from: 'clockifytasks',
          let: { projectInternalId: '$internalId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$projectInternalId', '$$projectInternalId'] },
                    { $in: [req.user.internalId, '$assigneeIds'] },
                  ],
                },
              },
            },
          ],
          as: 'tasks',
        },
      },
      {
        $lookup: {
          from: 'clockifyclients',
          localField: 'clientInternalId',
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
        $sort: sortOptions,
      },
    ]);
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

exports.sync = async (req, res, next) => {
  try {
    const result = await executeSuiteQLQuery(
      'SELECT job.id AS ProjectID, job.altname AS ALTNAME, customer.entitytitle AS CustomerName, customer.id AS CustomerID FROM job LEFT JOIN customer ON customer.id = job.customer'
    );
    const items = result.items || [];

    // iterate items and create/update projects, clients
    for (const item of items) {
      if (item.customerid) {
        const client = await Client.findOne({ internalId: item.customerid });
        if (client) {
          client['name'] = item['customername'];
          await client.save();
        } else {
          await Client.create({
            name: item['customername'],
            internalId: item['customerid'],
          });
        }
      }
      const project = await Project.findOne({ internalId: item.projectid });
      if (project) {
        project['name'] = item['altname'];
        await project.save();
      } else {
        await Project.create({
          name: item['altname'],
          internalId: item['projectid'],
          clientInternalId: item['customerid'],
        });
      }
    }

    res.json({ message: `Synced ${items.length} projects.` }).end();
  } catch (error) {
    next(error);
  }
};
