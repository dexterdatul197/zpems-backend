const { OpenAI } = require('openai');
const Settings = require('../models/settings.model');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const sharp = require('sharp');

let openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// TODO: deprecated
async function loadOpenAISettings() {
  const settings = await Settings.findOne(); // replace with your actual query
  openai = new OpenAI({ apiKey: settings.openAIAPIKey });

  console.log('open ai settings loaded', settings);
}

async function encodeImage(imagePath) {
  // generate resized path from imagePath
  const extension = path.extname(imagePath);
  const resizedImagePath = imagePath.replace(extension, `-resized${extension}`);
  console.log('resizedImagePath', resizedImagePath);

  if (!fs.existsSync(resizedImagePath)) {
    console.log('resizing image');

    // resize image to about 50kb
    await sharp(imagePath)
      .resize({ width: 400 }) // adjust the width to get the desired size
      .toFile(resizedImagePath);
  }

  // read the resized image
  const image = fs.readFileSync(resizedImagePath);

  return Buffer.from(image).toString('base64');
}

const parseReceiptImageWithChatGPT = async (imagePath) => {
  const base64Image = await encodeImage(imagePath);
  const imageUrl = `data:image/png;base64,${base64Image}`;
  // const imageUrl = 'https://zpems.s3.us-east-2.amazonaws.com/receipt2.jpg';
  // // const imageUrl =
  // // 'https://zpems.s3.us-east-2.amazonaws.com/w_c77e027c6ceeaf92347b0bec0d1c60270a93b6d3%20%281%29.jpg';

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },

          {
            type: 'text',
            text: `
            extract the following info of the expense receipt:
            - line items
            - expense category
            - merchant name
            - date
            - total amount
            `,
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
};

const getChatgptCompletion = async ({ systemMessage, userMessage }) => {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: systemMessage },
      {
        role: 'user',
        content: userMessage,
      },
    ],
    model: 'gpt-3.5-turbo-1106',
    response_format: { type: 'json_object' },
  });

  return completion.choices[0].message.content;
};

const getTimeEntryJson = async (timeEntryMessage, projects) => {
  const userMessage = `
  ${JSON.stringify(projects)}

I need to capture time entry as json format from a memo from the above projects/tasks.

Here is the json format.

 { Project: <project name>,
   ProjectId: <project id>,
   Task: <task name>,
   TaskId: <task id>,
   Duration: <duration>,
   Memo: <memo>
}

For example, user inputs "project ERP Success partners. I had 1 on 1 call with the manager for 30 mins." and the assistant translates it into a JSON object { Project: "ERP Success Partners", ProjectId: "3", Task: "1 on 1 meeting", TaskId: "2", Duration: "0.5", Memo: "I had 1 on 1 call with the manager for 30 mins"}

Can you give me the time entry for "${timeEntryMessage}"?
  `;

  const timeEntryJson = await getChatgptCompletion({
    systemMessage: 'You are a helpful assistant.',
    userMessage,
  });
  return timeEntryJson;
};

const transcribeAudioToText = async (audioPath) => {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  });
  return transcription;
};

module.exports = {
  parseReceiptImageWithChatGPT,
  getChatgptCompletion,
  getTimeEntryJson,
  transcribeAudioToText,
};
