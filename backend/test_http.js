fetch('http://localhost:4000/api/food/list')
  .then(res => res.json())
  .then(data => {
    console.log("Success:", data);
    process.exit(0);
  })
  .catch(err => {
    console.log("Error:", err);
    process.exit(1);
  });
