const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const path = require('path');

async function uploadFiles(runId) {
  const fullPath = path.join(__dirname);
  // const fullPath = path.join(this.appDirectory, 'output', this.clientId, runId);
  const formData = new FormData();
  formData.append('runId', runId);
  const fileNames = await fs.readdir(fullPath);
  fileNames.forEach((fileName) => {
    const filePath = path.join(fullPath, fileName);
    const readStream = createReadStream(filePath);
    formData.append('file', readStream, fileName);
  });

  const authToken = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyOTdiZDNkYmFiZDIxNjk3OGI2ODIwZSIsImFwaUtleSI6IkFBQUFFQUFIb1NBSE1TVW5VR3ZLdTg2U0dNWUZrdjJiU0RSQThPM1NGV1M2ZTNGTjlVdjVmcXBSMTZSTmdaUnYrQ293aVdGeTlZNEtYeGFzMDZpWlR3NWw0c3ZaMDBITXp4dUFWMEhCRmpuUGg1b3ZXanN3U0E9PSIsImlhdCI6MTY1NDc5MjY2OCwiYXVkIjoiY29pbnN0YWMiLCJpc3MiOiJjb2luc3RhYyIsInN1YiI6ImNvaW5zdGFjIn0.04BrFNCSwQvURL3vLh3g0-eVwWFGCgUwxloAMdFwBYU`
  // upload them all through an axios post
  axios.post(
    // `${this.clientServerURL}/uploadFiles`,
    `http://localhost:3100/uploadFiles`,
    formData,
    {
      headers: {
        // Authorization: `Bearer ${this.token}`,
        Authorization: authToken,
        ...formData.getHeaders(),
      },
    }
  ).then((result) => {
    console.log(result);
  }).catch((e) => {
    console.log(e);
  });
}

uploadFiles("6298ef8a1827aa54a4bc941a");
