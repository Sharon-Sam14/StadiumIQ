import { server } from "./app";

const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`[Volunteer Service] listening on port ${PORT}`);
});
