const selectedDate = document.currentScript.getAttribute('date');

const date = new Date(selectedDate);

const options = {
  year: "numeric",
  month: "long",
  day: "numeric"
};

const formatted = date.toLocaleDateString('ru-RU', options);
document.getElementById("formattedDate").innerHTML = formatted;