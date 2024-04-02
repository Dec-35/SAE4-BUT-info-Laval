var products = [];
fetch('/api/admin/products')
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      console.log(data.products);
      products = data.products;

      const monthlySales = getMonthlySales();
      showSalesLineGraph(monthlySales);
      console.log(monthlySales);

      const salesByProduct = getSalesByProduct();
      console.log(salesByProduct);
      showSalesBarChart(salesByProduct);
    } else {
      console.log(data.message);
      userAlert(data.message);
    }
  });

document.querySelectorAll('.productImage').forEach((el) => {
  el.parentElement.style.backgroundColor = randomPastelColor(
    el.parentElement.querySelector('h4').textContent
  );
});

function closePopup() {
  document.getElementById('popup').remove();
  document.body.style.overflowY = 'scroll';
}

function deleteProduct(id) {
  console.log(id);
}

function modifyProduct(e) {
  e.preventDefault();
  //get the form data
  const form = document.getElementById('editProductForm');
  const formData = new FormData(form);

  //send the form data
  fetch('/api/admin/product/edit', {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        userAlertGood(data.message);
        closePopup();
        location.reload();
      } else {
        userAlert(data.message);
      }
    });
}

function editProduct(id) {
  const product = products.find((product) => product.id == id);
  if (!product) return userAlert('Produit introuvable');
  //show popup with all product infos
  //pop up
  const popup = document.createElement('div');
  document.body.style.overflowY = 'hidden';
  popup.classList.add('popup');
  popup.setAttribute('id', 'popup');
  const popupContent = document.createElement('div');
  popupContent.classList.add('popupContent');

  popup.addEventListener('click', (e) => {
    if (e.target == popup) {
      closePopup();
    }
  });

  const popupTitle = document.createElement('h3');
  popupTitle.innerText = 'Modifier "' + product.name + '"';
  popupTitle.classList.add('popupTitle');
  const popupClose = document.createElement('button');
  popupClose.innerText = 'Fermer';
  popupClose.setAttribute('onclick', 'closePopup()');
  popupClose.classList.add('adminStyleButton');
  popupClose.classList.add('closeButton');
  popupContent.appendChild(popupClose);
  popupContent.appendChild(popupTitle);

  const editProductForm = document.createElement('form');
  editProductForm.classList.add('productDesc');
  editProductForm.classList.add('adminForm');
  editProductForm.setAttribute('id', 'editProductForm');
  editProductForm.addEventListener('submit', modifyProduct);

  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'name');
  nameLabel.innerText = 'Nom du produit';
  editProductForm.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('name', 'name');
  nameInput.setAttribute('placeholder', 'Nom du produit');
  nameInput.setAttribute('value', product.name);
  editProductForm.appendChild(nameInput);

  const descriptionLabel = document.createElement('label');
  descriptionLabel.setAttribute('for', 'description');
  descriptionLabel.innerText = 'Description';
  editProductForm.appendChild(descriptionLabel);

  const descriptionInput = document.createElement('input');
  descriptionInput.setAttribute('type', 'text');
  descriptionInput.setAttribute('name', 'description');
  descriptionInput.setAttribute('maxlength', '255');
  descriptionInput.setAttribute('placeholder', 'Description');
  descriptionInput.setAttribute('value', product.description);
  editProductForm.appendChild(descriptionInput);

  const priceAndConfirmSpan = document.createElement('span');

  const priceSpan = document.createElement('span');
  priceSpan.classList.add('verticalflex');

  const priceLabel = document.createElement('label');
  priceLabel.setAttribute('for', 'price');
  priceLabel.innerText = 'Prix';

  const priceInput = document.createElement('input');
  priceInput.setAttribute('type', 'number');
  priceInput.setAttribute('name', 'price');
  priceInput.setAttribute('placeholder', 'Prix');
  priceInput.setAttribute('value', product.price);
  priceInput.setAttribute('min', "0");

  const confirmSpan = document.createElement('span');
  confirmSpan.classList.add('verticalflex');

  const confirmThreasholdLabel = document.createElement('label');
  confirmThreasholdLabel.setAttribute('for', 'confirm_threashold');
  confirmThreasholdLabel.innerText = 'Seuil de confirmation';

  const confirmThreasholdInput = document.createElement('input');
  confirmThreasholdInput.setAttribute('type', 'number');
  confirmThreasholdInput.setAttribute('name', 'confirm_threashold');
  confirmThreasholdInput.setAttribute('placeholder', 'Seuil de confirmation');
  confirmThreasholdInput.setAttribute('value', product.confirm_threashold);

  priceSpan.appendChild(priceLabel);
  priceSpan.appendChild(priceInput);

  confirmSpan.appendChild(confirmThreasholdLabel);
  confirmSpan.appendChild(confirmThreasholdInput);

  priceAndConfirmSpan.appendChild(priceSpan);
  priceAndConfirmSpan.appendChild(confirmSpan);

  editProductForm.appendChild(priceAndConfirmSpan);

  const imageLabel = document.createElement('label');
  imageLabel.setAttribute('for', 'image');
  imageLabel.innerText = 'Image';
  editProductForm.appendChild(imageLabel);

  const imageInput = document.createElement('input');
  imageInput.setAttribute('type', 'file');
  imageInput.setAttribute('name', 'image');
  imageInput.setAttribute('placeholder', 'Image');
  editProductForm.appendChild(imageInput);

  const releaseDateLabel = document.createElement('label');
  releaseDateLabel.setAttribute('for', 'release_date');
  releaseDateLabel.innerText = 'Date de sortie';
  editProductForm.appendChild(releaseDateLabel);

  const releaseDateInput = document.createElement('input');
  releaseDateInput.setAttribute('type', 'datetime-local');
  releaseDateInput.setAttribute('name', 'release_date');
  releaseDateInput.setAttribute('placeholder', 'Date de sortie');
  releaseDateInput.setAttribute(
    'value',
    new Date(product.release_date).toISOString().slice(0, 16)
  );
  editProductForm.appendChild(releaseDateInput);

  const expireDateLabel = document.createElement('label');
  expireDateLabel.setAttribute('for', 'expire_date');
  expireDateLabel.innerText = "Date d'expiration";
  editProductForm.appendChild(expireDateLabel);

  const expireDateInput = document.createElement('input');
  expireDateInput.setAttribute('type', 'datetime-local');
  expireDateInput.setAttribute('name', 'expire_date');
  expireDateInput.setAttribute('placeholder', "Date d'expiration");
  expireDateInput.setAttribute(
    'value',
    new Date(product.expire_date).toISOString().slice(0, 16)
  );
  editProductForm.appendChild(expireDateInput);

  const optionsSpan = document.createElement('span');

  const sizeSpan = document.createElement('span');
  sizeSpan.classList.add('verticalflex');
  const sizesLabel = document.createElement('label');
  sizesLabel.setAttribute('for', 'sizes');
  sizesLabel.innerText = 'Tailles';
  sizeSpan.appendChild(sizesLabel);

  const sizes = product.sizes.join(', ');
  const colors = product.colors.join(', ');

  const sizesInput = document.createElement('input');
  sizesInput.setAttribute('type', 'text');
  sizesInput.setAttribute('name', 'sizes');
  sizesInput.setAttribute('placeholder', 'Tailles');
  sizesInput.setAttribute('value', sizes);
  sizeSpan.appendChild(sizesInput);

  const colorSpan = document.createElement('span');
  colorSpan.classList.add('verticalflex');
  const colorsLabel = document.createElement('label');
  colorsLabel.setAttribute('for', 'colors');
  colorsLabel.innerText = 'Couleurs';
  colorSpan.appendChild(colorsLabel);

  const colorsInput = document.createElement('input');
  colorsInput.setAttribute('type', 'text');
  colorsInput.setAttribute('name', 'colors');
  colorsInput.setAttribute('placeholder', 'Couleurs');
  colorsInput.setAttribute('value', colors);
  colorSpan.appendChild(colorsInput);

  optionsSpan.appendChild(sizeSpan);
  optionsSpan.appendChild(colorSpan);
  editProductForm.appendChild(optionsSpan);

  const productIdInput = document.createElement('input');
  productIdInput.setAttribute('type', 'hidden');
  productIdInput.setAttribute('name', 'id');
  productIdInput.setAttribute('value', product.id);
  editProductForm.appendChild(productIdInput);

  const promotedSpan = document.createElement('span');
  promotedSpan.innerHTML = '<p>Promu</p>';
  promotedSpan.classList.add('promotedSpan');

  const promotedInput = document.createElement('input');
  promotedInput.setAttribute('type', 'checkbox');
  promotedInput.setAttribute('name', 'is_promoted');
  if (product.is_promoted) {
    promotedInput.setAttribute('checked', 'checked');
  }

  promotedSpan.appendChild(promotedInput);
  editProductForm.appendChild(promotedSpan);

  const submitButton = document.createElement('button');
  submitButton.setAttribute('type', 'submit');
  submitButton.classList.add('adminButton');
  submitButton.innerText = 'Modifier';
  editProductForm.appendChild(submitButton);

  popupContent.appendChild(editProductForm);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}

function showSales(id) {
  const product = products.find((product) => product.id == id);
  //show popup with list of sales
  //pop up
  const popup = document.createElement('div');
  document.body.style.overflowY = 'hidden';
  popup.classList.add('popup');
  popup.setAttribute('id', 'popup');
  const popupContent = document.createElement('div');
  popupContent.classList.add('popupContent');

  popup.addEventListener('click', (e) => {
    if (e.target == popup) {
      closePopup();
    }
  });

  const salesNb = product.sales.length;

  const popupTitle = document.createElement('h3');
  popupTitle.innerText = salesNb + ' ventes de "' + product.name + '"';
  popupTitle.classList.add('popupTitle');
  const popupPriceTotal = document.createElement('p');

  const popupClose = document.createElement('button');
  popupClose.innerText = 'Fermer';
  popupClose.setAttribute('onclick', 'closePopup()');
  popupClose.classList.add('adminStyleButton');
  popupClose.classList.add('closeButton');
  popupContent.appendChild(popupClose);
  popupContent.appendChild(popupTitle);

  if (product.sales.length == 0) {
    const noSales = document.createElement('p');
    noSales.innerText = 'Aucune vente pour ce produit';
    popupContent.appendChild(noSales);
  } else {
    let salesTotalPrice = 0;
    var searchUserResults = document.createElement('div');
    searchUserResults.setAttribute('id', 'searchUserResults');

    product.sales.forEach((sale) => {
      const saleDiv = document.createElement('div');
      saleDiv.classList.add('sale');
      saleDiv.title = 'Vendu le ' + new Date(sale.date).toLocaleString('fr-FR');
      const saleUser = document.createElement('p');
      let userEmail = sale.buyer;
      //remove etu@univ-lemans.fr if it exists in the email to extract the name
      if (userEmail.includes('etu@univ-lemans.fr')) {
        userEmail = userEmail.replace('.etu@univ-lemans.fr', '');
        const emailArgs = userEmail.split('.');
        userEmail =
          emailArgs[0][0].toUpperCase() +
          emailArgs[0].substr(1) +
          ' ' +
          emailArgs[1][0].toUpperCase() +
          emailArgs[1].substr(1);
      }
      saleUser.innerText = userEmail;
      saleDiv.appendChild(saleUser);

      if (
        sale.product_details &&
        sale.product_details != 'undefined' &&
        sale.product_details != ''
      ) {
        const itemDetails = document.createElement('p');
        itemDetails.innerText =
          'Taille et/ou couleur : ' + sale.product_details.toUpperCase();
        saleDiv.appendChild(itemDetails);
      }

      searchUserResults.appendChild(saleDiv);
      salesTotalPrice += sale.price;
    });

    popupPriceTotal.innerText = 'Total : ' + salesTotalPrice + '€';
    popupPriceTotal.classList.add('popupPriceTotal');
    popupContent.appendChild(popupPriceTotal);
    popupContent.appendChild(searchUserResults);
  }

  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}

function addProduct(e) {
  e.preventDefault();
  //get the form data
  const form = document.getElementById('addNewProductForm');
  const formData = new FormData(form);

  //send the form data
  fetch('/api/admin/product/add', {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        userAlertGood(data.message);
        location.reload();
      } else {
        userAlert(data.message);
      }
    });
}

function addBuyerToEvent(eventId) {
  const product = products.find((product) => product.id == eventId);
  //show popup with list of sales
  //pop up
  const popup = document.createElement('div');
  document.body.style.overflowY = 'hidden';
  popup.classList.add('popup');
  popup.setAttribute('id', 'popup');
  const popupContent = document.createElement('div');
  popupContent.classList.add('popupContent');

  popup.addEventListener('click', (e) => {
    if (e.target == popup) {
      closePopup();
    }
  });

  const popupTitle = document.createElement('h3');
  popupTitle.innerText = 'Ajouter un acheteur à "' + product.name + '"';
  popupTitle.classList.add('popupTitle');
  const popupClose = document.createElement('button');
  popupClose.innerText = 'Fermer';
  popupClose.setAttribute('onclick', 'closePopup()');
  popupClose.classList.add('adminStyleButton');
  popupClose.classList.add('closeButton');
  popupContent.appendChild(popupClose);
  popupContent.appendChild(popupTitle);

  const searchUserForm = document.createElement('form');
  searchUserForm.classList.add('productDesc');
  searchUserForm.classList.add('adminForm');
  searchUserForm.setAttribute('id', 'searchUserForm');

  const searchUserInput = document.createElement('input');
  searchUserInput.setAttribute('type', 'text');
  searchUserInput.setAttribute('name', 'email');
  searchUserInput.setAttribute('placeholder', "Email de l'acheteur");
  searchUserForm.appendChild(searchUserInput);

  const searchUserResults = document.createElement('div');
  searchUserResults.setAttribute('id', 'searchUserResults');
  searchUserForm.appendChild(searchUserResults);

  searchUserInput.addEventListener('keyup', (e) => {
    if (e.target.value.length < 3) return;
    const email = e.target.value;
    fetch('/api/admin/searchUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: email,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log(data.results);
          searchUserResults.innerHTML = '';
          if (data.results.length == 0) {
            const noResults = document.createElement('p');
            noResults.innerText = 'Aucun résultat';
            searchUserResults.appendChild(noResults);

            const addUserButton = document.createElement('button');
            addUserButton.innerText = 'Ajouter ' + email;
            addUserButton.classList.add('adminButton');
            searchUserResults.appendChild(addUserButton);

            addUserButton.addEventListener('click', (e) => {
              e.preventDefault(); //prevent parent form from submitting
              addBuyer(eventId, email);
            });
          } else {
            data.results.forEach((user) => {
              const userDiv = document.createElement('div');
              userDiv.classList.add('user');
              userDiv.title = user.email;
              const userName = document.createElement('p');
              userName.classList.add('sale');
              userName.classList.add('clickable');
              userName.innerText = user.email + ' (' + user.username + ')';
              userDiv.appendChild(userName);
              userDiv.addEventListener('click', (e) => { addBuyer(eventId, user.email)});
              searchUserResults.appendChild(userDiv);
            });
          }
        } else {
          userAlert(data.message);
        }
      });
  });

  popupContent.appendChild(searchUserForm);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}

document
  .getElementById('addNewProductForm')
  .addEventListener('submit', addProduct);

function addBuyer(productId, email) {
  const options = prompt(
    'Taille et/ou couleur (laisser vide si non-applicable)'
  );
  if(options === null) return;

  fetch('/api/admin/products/addBuyer', {
    method: 'POST',
    body: JSON.stringify({
      productId: productId,
      buyer: email,
      options: options,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        userAlertGood(data.message);
        closePopup();
        location.reload();
      } else {
        userAlert(data.message);
      }
    });
}

//graphs

const salesLineGraph = document.getElementById('salesLineGraph');
const salesBarChart = document.getElementById('salesBarChart');

// monthly sales in line graph using sales lists from products list (product.sales.date)
function getMonthlySales() {
  const months = [];
  const salesByMonth = [];
  const amountByMonth = [];

  products.forEach((product) => {
    product.sales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      //sale month and year. Month in locale letters
      const saleMonth = saleDate.toLocaleString('fr-FR', {
        month: 'long',
      });
      const saleYear = saleDate.getFullYear();
      const saleMonthYear = saleMonth + ' ' + saleYear;

      if (!months.includes(saleMonthYear)) {
        months.push(saleMonthYear);
        salesByMonth.push(1);
        amountByMonth.push(sale.price);
      } else {
        const index = months.indexOf(saleMonthYear);
        salesByMonth[index]++;
        amountByMonth[index] += sale.price;
      }
    });
  });

  //invert the arrays (oldest to newest)
  months.reverse();
  salesByMonth.reverse();
  amountByMonth.reverse();

  return {months, salesByMonth, amountByMonth};
}

function showSalesLineGraph(monthlySales) {
  const salesLineGraphChart = new Chart(salesLineGraph, {
    type: 'line',
    data: {
      labels: monthlySales.months,
      datasets: [
        {
          label: 'Ventes mensuelles',
          data: monthlySales.salesByMonth,
          yAxisID: 'linear',
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgb(75, 192, 192, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Montant mensuel',
          data: monthlySales.amountByMonth,
          yAxisID: 'logarithmic',
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.25,
        },
      ],
    },
    options: {
      scales: {
        linear: {
          type: 'linear',
          position: 'left',
          ticks: {
            beginAtZero: true,
            stepSize: 1,
          },
        },
        logarithmic: {
          type: 'linear',
          position: 'right',
          ticks: {
            // Adjust the min value to avoid issues with log scale
            stepSize: 10,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// sales by product in bar chart using sales count from products list (product.sales.length)
function getSalesByProduct() {
  const sales = [];
  const productsNames = [];
  const salesByProduct = [];
  products.forEach((product) => {
    productsNames.push(product.name);
    salesByProduct.push(product.sales.length);
  });
  return {productsNames, salesByProduct};
}

function showSalesBarChart(salesByProduct) {
  const salesBarChartChart = new Chart(salesBarChart, {
    type: 'bar',
    data: {
      labels: salesByProduct.productsNames,
      datasets: [
        {
          label: 'Ventes par produit',
          data: salesByProduct.salesByProduct,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 0.5,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
