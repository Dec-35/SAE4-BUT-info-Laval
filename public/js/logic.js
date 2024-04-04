//get color theme cookie
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  //split cookie into array
  var ca = decodedCookie.split(";");
  //loop through array
  for (var i = 0; i < ca.length; i++) {
    //get current cookie
    var c = ca[i];
    //remove whitespace
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    //if cookie is found, return cookie value
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  //if cookie is not found, return empty string
  return "";
}

//set color theme cookie
function setCookie(cname, cvalue, exdays) {
  //get current date
  var d = new Date();
  //set expiration date
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  //set cookie
  var expires = "expires=" + d.toUTCString();
  document.cookie =
    cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=Strict";
}

var theme = getCookie("theme");
//if cookie is set, set theme to cookie value

if (theme !== "") {
  document.body.setAttribute("data-theme", theme);
} else {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    theme = "light";
  } else {
    theme = "dark";
  }
  document.body.setAttribute("data-theme", theme);
}

function switchTheme(button) {
  button.innerHTML = theme == "light" ? "Theme clair" : "Theme sombre";
  document.body.setAttribute("data-theme", theme == "light" ? "dark" : "light");
  theme = theme == "light" ? "dark" : "light";
  setCookie("theme", theme, 365);
}

function changerClasse() {
  var modal = document.getElementById("modal");
  modal.style.display = "block";

  // Ajouter un événement pour fermer la boîte de dialogue lorsque l'utilisateur clique sur le bouton de fermeture
  var closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };

  // Ajouter un événement pour confirmer la classe sélectionnée
  var confirmBtn = document.getElementById("confirmBtn");
  confirmBtn.onclick = function () {
    var classe = document.getElementById("classeSelect").value;
    if (classe != null) {
      fetch('/api/user/changeClass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classe: classe,
        }),
      }).then((res) => {
        if (res.status === 200) {
          userAlertGood('Classe changée avec succès !');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (res.status === 403) {
          userAlert(
            'Vous ne pouvez pas faire ça. Arrêtez ou vous serez signalé au département'
          );
        }
      });
      modal.style.display = "none";
    }
  };
}

//fetch the banner
if (document.querySelector("header") !== null) {
  fetch("/api/getBannerInfo")
    .then((res) => res.json())
    .then((data) => {
      if (data.isShown) {
        createBanner(data.color, data.textToShow, data.link, data.linkBody);
      }
    });
  function createBanner(color, text, link, linkBody) {
    const banner = document.createElement("div");
    banner.id = "banner";
    banner.style.backgroundColor = color;

    const bannerText = document.createElement("p");
    bannerText.innerText = text;

    const bannerLink = document.createElement("a");
    bannerLink.href = link;
    bannerLink.innerText = linkBody;
    bannerLink.target = "_blank";
    bannerLink.rel = "noopener noreferrer";
    bannerLink.id = "bannerLink";

    banner.appendChild(bannerText);
    banner.appendChild(bannerLink);

    document.querySelector("header").appendChild(banner);
  }
}

function togglePassVis() {
  const passInputs = document.querySelectorAll(
    "#loginPassword, #registerPassword"
  );

  passInputs.forEach((input) => {
    if (input.type === "password") {
      input.type = "text";
    } else {
      input.type = "password";
    }
  });

  const passVisButtons = document.querySelectorAll(".passVisToggle");
  passVisButtons.forEach((button) => {
    if (button.getAttribute("data-status") === "hidden") {
      button.setAttribute("data-status", "visible");
      button.innerHTML =
        '<path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z" />';
    } else {
      button.setAttribute("data-status", "hidden");
      button.innerHTML =
        '<path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" />';
    }
  });
}

// ----------------CALENDAR PART----------------

function djb2Hash(s) {
  let hashValue = 5381;
  for (let i = 0; i < s.length; i++) {
    hashValue = (hashValue << 5) + hashValue + s.charCodeAt(i);
  }
  return hashValue >> 0; // Convert to a 32-bit signed integer
}

function getFormattedDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateEventId(startDate, title) {
  const formattedDate = getFormattedDate(startDate);
  const uniqueString = formattedDate + title;
  const hashedValue = djb2Hash(uniqueString);
  const maxInt32 = 2147483647;

  return Math.abs(hashedValue) % (maxInt32 + 1);
}

let selectedEvent = null;

function showOverlay(image) {
  const overlay = document.getElementById("overlay");
  overlay.classList.add("visible");

  const loader = document.getElementById("loader");
  loader.classList.add("visible");

  //set the image's --image-url to the link
  document
    .getElementById("image")
    .style.setProperty("--image-url", "url(../images/events/" + image + ")");

  const imageInfoOverlay = document.getElementById("imageInfoOverlay");
  if (imageInfoOverlay.firstChild)
    imageInfoOverlay.removeChild(imageInfoOverlay.firstChild);

  setTimeout(() => {
    loader.classList.remove("visible");

    //toggle the overlay
    const eventCard = document.getElementById("eventCard");
    eventCard.classList.add("visible");
  }, 1000);
}

function userAlertGood(message) {
  alertSystem(message, "green");
}

function userAlert(message) {
  alertSystem(message, "red");
}

function alertSystem(message, color) {
  const popup = document.createElement("div");
  popup.classList.add("alertPopup");
  popup.classList.add("visible");
  popup.style.backgroundColor = color;
  message =
    message === undefined ? (color === "red" ? "Erreur" : "Succès") : message;
  popup.innerHTML = message;
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.classList.remove("visible");
  }, (message.length / 15) * 1000 + 1500);
  setTimeout(() => {
    popup.remove();
  }, (message.length / 15) * 1000 + 1800);
}

function toggleMoreInfo() {
  const info = document.getElementById("showMore");
  info.classList.toggle("expanded");
}

function cleanStringToObject(inputString) {
  // Extract content within <span> tags
  const spanContent = inputString.match(/<span>(.*?)<\/span>/)[1];

  // Split content based on curly braces {} to separate key-value pairs
  const keyValuePairs = spanContent.split(/\s*},\s*/);

  // Remove empty strings and trim whitespace from each key-value pair
  const cleanedObject = {};
  keyValuePairs.forEach((pair) => {
    const [key, value] = pair
      .replace(/[{}]/g, "")
      .split(":")
      .map((part) => part.trim());
    if (key && value) {
      cleanedObject[key] = value;
    }
  });

  return cleanedObject;
}

function renderEventsCalendar(events) {
  const calendarEl = document.getElementById("eventsCalendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    views: {
      listMonth: {
        type: "listMonth",
        duration: { months: 1 },
      },
    },
    initialView: "listMonth",

    initialDate: new Date(),
    headerToolbar: {
      left: "title",
      center: "",
      right: "prev,next today",
    },
    //set the height of the calendar to auto
    height: "auto",
    buttonText: {
      today: "Aujourd'hui",
    },
    locale: "fr",
    events: events,
    eventClick: function (info) {
      var event = info.event;
      console.log(event);
      var title = event.title;

      var start = event.start;

      //Dans ... mois / semaines / jours / heures / minutes
      var reverseTime = "Dans ";
      var timeDiff = start - new Date();
      var months = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 30));
      var weeks = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
      var days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      var hours = Math.floor(timeDiff / (1000 * 60 * 60));
      var minutes = Math.floor(timeDiff / (1000 * 60));
      if (months > 0) {
        reverseTime += months + " mois";
      } else if (weeks > 0) {
        reverseTime += weeks + " semaines";
      } else if (days > 0) {
        reverseTime += days + " jours";
      } else if (hours > 0) {
        reverseTime += hours + " heures et " + (minutes % 60) + " minutes";
      } else if (minutes > 0) {
        reverseTime += minutes + " minutes";
      } else {
        reverseTime = "Evenement terminé";
      }

      var location = event.extendedProps.location;

      var description = event.extendedProps.description;

      // in this form <span>{description : Déguisez-vous pour célébrer cet événement !}, {prix : -1}, {image:carnaval.webp}</span>
      var eventDescription = cleanStringToObject(description);
      console.log(eventDescription);

      const eventPrice = parseFloat(eventDescription["prix"]);

      if (window.userGrade === "Diamant") {
        eventPrice = eventPrice * 0.9;
      }
      // Now you can use these variables to set the event details in the overlay
      document.getElementById("eventDescription").innerHTML =
        eventDescription["description"];
      showOverlay(eventDescription["image"]);

      //make the date in ISO 8601 format
      let found = false;
      var userEvents = [];
      fetch("/api/user/getEventsUser", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            userEvents = data.events;

            userEvents.forEach((eventResult) => {
              var eventStart = new Date(eventResult.date);
              if (
                eventResult.name === title &&
                event.start.getTime() === eventStart.getTime()
              ) {
                found = true;
              }
            });

            if (found) {
              document.getElementById("eventPrice").innerHTML = "Inscrit";
              document.getElementById("priceInfo").style.display = "none";
              document.getElementById("addEvent").style.display = "none";
            } else if (eventPrice === 0) {
              document.getElementById("eventPrice").innerHTML = "Gratuit";
              document.getElementById("priceInfo").style.display = "none";
              document.getElementById("addEvent").style.display = "block";
            } else {
              document.getElementById("eventPrice").innerHTML =
                eventPrice + "€";
              document.getElementById("priceInfo").style.display = "block";
              document.getElementById("addEvent").style.display = "block";
            }

            if (eventPrice === -1) {
              document.getElementById("eventPrice").innerHTML =
                "Prix non défini";
              document
                .getElementById("addEvent")
                .setAttribute("disabled", "true");
              document.getElementById("priceInfo").style.display = "none";
            }

            selectedEvent = {
              id: generateEventId(event.start, event.title),
            };

            //set the event details in the overlay
            document.getElementById("eventTitle").innerHTML = title;
            document.getElementById("eventTime").innerHTML = reverseTime;
            document.getElementById("eventLocation").innerHTML = location;
          }
        });
    },
  });

  calendarEl.style.width = "90%";
  calendar.render();
}

//check if addEvent exists before adding event listener
if (document.getElementById("addEvent") !== null) {
  document.getElementById("addEvent").addEventListener("click", (e) => {
    if (selectedEvent === null) {
      return;
    }

    fetch("/addItemToCartPort", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "item-type": "event",
      },
      body: JSON.stringify({
        id: selectedEvent.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          //reload the page
          userAlertGood("Item ajouté au panier");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          userAlert("Erreur : " + data.message);
        }
      });

    selectedEvent = null;
  });
}
//check if the window.calData is defined
if (window.calData !== undefined) {
  // Extract the event objects from the data object
  const eventObjects = Object.values(window.calData);

  // Iterate over the event objects and extract necessary details
  const events = eventObjects.map((eventObject) => {
    return {
      title: eventObject.summary,
      start: new Date(eventObject.start),
      end: new Date(eventObject.end),
      location: eventObject.location,
      description: eventObject.description,
      // Add more properties as needed
    };
  });

  //filter out the past events
  const today = new Date();
  const filteredEvents = events.filter((event) => {
    return event.end > today;
  });

  renderEventsCalendar(filteredEvents);
}

const gradeButtons = document.querySelectorAll(".gradeBuyButton");
gradeButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();

    if (button.classList.contains("unsubButton")) {
      fetch("/api/user/unsubscribe", {
        method: "POST",
        headers: {
          "Content-type": "appication/json",
        },
        body: JSON.stringify({ id: "" }),
      }).then((res) => {
        if (res.status === 200) {
          userAlertGood("Vous avez bien été désabonné.");

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          userAlert(
            "Quelque chose s'est mal passé, merci de réessayer plus tard. Si le probleme persiste, merci de le signaler aupres de l'adiil."
          );
        }
      });
    } else {
      fetch("/addItemToCartPort", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "item-type": "grade",
        },
        body: JSON.stringify({
          id: e.target.classList[1][1],
        }),
      })
        .then((res) => {
          if (res.status === 200) {
            userAlertGood("Grade ajouté au panier");
            setTimeout(() => {
              window.location.href = "/pay";
            }, 1000);
          }
          return res.json();
        })
        .then((data) => {
          if (!data.success) {
            userAlert(data.message);
          }
        });
    }
  });
});

function randomPastelColor(str) {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  return `hsl(${
    parseInt(
      [...str]
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        .toString(16)
        .slice(0, 6),
      16
    ) % 360
  }, 30%, ${isDark ? "60%" : "80%"})`;
}
