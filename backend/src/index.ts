import app from "./app";

// Default to port 4002 to match the client's expectation. Can be overridden via PORT env var.
const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
