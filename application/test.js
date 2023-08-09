let hey = "001,002, 003"
heyArr = hey.split(",")
heyArr.forEach((elem) => {
    console.log(elem.trim());
})