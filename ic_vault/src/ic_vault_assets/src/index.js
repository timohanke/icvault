import { ic_vault } from "../../declarations/ic_vault";

document.getElementById("clickMeBtn").addEventListener("click", async () => {
  const name = document.getElementById("name").value.toString();
  // Interact with ic_vault actor, calling the greet method
  const greeting = await ic_vault.greet(name);

  document.getElementById("greeting").innerText = greeting;
});
