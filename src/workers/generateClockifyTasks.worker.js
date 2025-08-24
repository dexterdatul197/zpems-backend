Promise = require('bluebird'); // eslint-disable-line no-global-assign
const mongoose = require('mongoose');

const mongooseConfig = require('../config/mongoose');
const Task = require('../api/clockify/models/task.model');
const Project = require('../api/clockify/models/project.model');
const Client = require('../api/clockify/models/client.model');

const main = async () => {
  await mongooseConfig.connect();

  await Client.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // generate clients
  const clients = [
    {
      name: 'Client 1',
      internalId: '1',
    },
    {
      name: 'Client 2',
      internalId: '2',
    },
    {
      name: 'Client 3',
      internalId: '3',
    },
  ];

  const createdClients = await Client.insertMany(clients);

  // generate projects

  const projects = [
    {
      name: 'Project 1',
      clientInternalId: createdClients[0].internalId,
      internalId: '1',
    },
    {
      name: 'Project 2',
      clientInternalId: createdClients[0].internalId,
      internalId: '2',
    },
    {
      name: 'Project 3',
      clientInternalId: createdClients[1].internalId,
      internalId: '3',
    },
    {
      name: 'Project 4',
      clientInternalId: createdClients[1].internalId,
      internalId: '4',
    },
    {
      name: 'Project 5',
      clientInternalId: createdClients[2].internalId,
      internalId: '5',
    },
  ];
  const createdProjects = await Project.insertMany(projects);

  const userInternalIds = ['100', '924'];

  // generate 10 tasks
  const tasks = [
    {
      name: 'Task 1',
      projectInternalId: createdProjects[0].internalId,
      assigneeIds: [userInternalIds[0], userInternalIds[1]],
      internalId: '1',
    },
    {
      name: 'Task 2',
      projectInternalId: createdProjects[0].internalId,
      assigneeIds: [userInternalIds[0]],
      internalId: '2',
    },
    {
      name: 'Task 3',
      projectInternalId: createdProjects[1].internalId,
      assigneeIds: [userInternalIds[1]],
      internalId: '3',
    },
    {
      name: 'Task 4',
      projectInternalId: createdProjects[1].internalId,
      assigneeIds: [userInternalIds[0]],
      internalId: '4',
    },
    {
      name: 'Task 5',
      projectInternalId: createdProjects[2].internalId,
      assigneeIds: [userInternalIds[1]],
      internalId: '5',
    },
    {
      name: 'Task 6',
      projectInternalId: createdProjects[2].internalId,
      assigneeIds: [userInternalIds[0]],
      internalId: '6',
    },
    {
      name: 'Task 7',
      projectInternalId: createdProjects[3].internalId,
      assigneeIds: [userInternalIds[1]],
      internalId: '7',
    },
    {
      name: 'Task 8',
      projectInternalId: createdProjects[3].internalId,
      assigneeIds: [userInternalIds[0]],
      internalId: '8',
    },
    {
      name: 'Task 9',
      projectInternalId: createdProjects[4].internalId,
      assigneeIds: [userInternalIds[1]],
      internalId: '9',
    },
    {
      name: 'Task 10',
      projectInternalId: createdProjects[4].internalId,
      assigneeIds: [userInternalIds[0]],
      internalId: '10',
    },
  ];

  await Task.insertMany(tasks);

  await mongooseConfig.disconnect();
};

main();
