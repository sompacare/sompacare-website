const url = process.argv[2] ?? "https://sompacare-facility.onrender.com/home";
const res = await fetch(url, { redirect: "manual" });
console.log("status", res.status);
console.log("location", res.headers.get("location"));
console.log("final check follow:", (await fetch(url, { redirect: "follow" })).status, (await fetch(url, { redirect: "follow" })).url);
