import { kv_store } from "../../declarations/kv_store";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with kv_store actor, calling the greet method
  const greeting = await kv_store.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
