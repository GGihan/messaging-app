import 'dotenv/config';
import app from "./app.js";

const PORT = process.env.PORT || 8080;

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }
  console.log(`Server is running at http://localhost:${PORT}/`);
});