import http from 'http';

http.get('http://localhost:3000/src/Models/xbot/xbot.glb', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("glb import response:", data.slice(0, 50));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
