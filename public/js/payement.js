let step = 1;

function checkEmptyCart() {
  const cart = document.querySelector('.cart>ul');
  if (cart.children.length === 1) {
    //remove column titles
    cart.children[0].remove();
    document.querySelector('.title').remove();

    //add empty cart info
    const emptyCartContainer = document.createElement('div');
    emptyCartContainer.innerHTML = '<h3 class="centerFlex">Panier vide</h3>';
    cart.appendChild(emptyCartContainer);

    //remove checkout button
    document.querySelector('.actionContainer').remove();
  }
}

document.querySelector('.payStep').style.display = 'none';

function updateTitle() {
  step === 1 ? (step = 2) : (step = 1);

  const selectors = document.querySelectorAll('.stepSelector>.selector');
  selectors.forEach(function (dot) {
    dot.classList.toggle('active');
  });

  document.querySelector('.title>h3').innerText === 'Paiement'
    ? (document.querySelector('.title>h3').innerText = 'Panier')
    : (document.querySelector('.title>h3').innerText = 'Paiement');

  if (step === 2) {
    const previousButton = document.createElement('div');
    previousButton.classList.add('selectorArrow');
    previousButton.classList.add('previous');
    previousButton.classList.add('nextStepButton');
    document.querySelector('.title').appendChild(previousButton);
    document.querySelector('.selectorArrow.next').remove();

    document.querySelector('.cart').style.display = 'none';
    document.querySelector('.payStep').style.display = 'flex';
  } else {
    const nextButton = document.createElement('div');
    nextButton.classList.add('selectorArrow');
    nextButton.classList.add('next');
    nextButton.classList.add('nextStepButton');
    document.querySelector('.title').appendChild(nextButton);
    document.querySelector('.selectorArrow.previous').remove();

    document.querySelector('.cart').style.display = 'flex';
    document.querySelector('.payStep').style.display = 'none';
  }

  //update trigger button List
  triggerButtonEvents();
}

function triggerButtonEvents() {
  let nextStepButtons = document.querySelectorAll('.nextStepButton');
  nextStepButtons.forEach(function (button) {
    button.addEventListener('click', updateTitle);
  });
}

triggerButtonEvents();

var cart = [];

fetch('/api/user/getCartItems', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((res) => res.json())
  .then((data) => {
    if (data.success) {
      cart = data.items;
      useCartItems(cart);
    } else {
      userAlert('Une erreur est survenue');
    }
  });

document.getElementById('payButton').addEventListener('click', () => {
  checkout(cart);
});

function useCartItems(cart) {
  console.log(cart);
  let total = 0;
  cart.forEach((item) => {
    const listItem = document.createElement('li');

    listItem.classList.add('cartItem');
    const spanItem = document.createElement('span');

    const title = document.createElement('p');
    const priceElement = document.createElement('p');
    const toggleSelector = document.createElement('div');
    const id = item.identifier.id;
    const type = item.identifier.type;
    let name = item.name;
    if (item.size) {
      name += ' (' + item.size.toUpperCase() + ')';
    }
    const price = item.price;
    total += price;
    title.innerText = name;
    priceElement.innerText = price.toFixed(2) + '€';
    toggleSelector.classList.add('toggleSelector');
    listItem.setAttribute('data-id', id);
    listItem.setAttribute('data-type', type);
    listItem.setAttribute('data-price', price);

    spanItem.appendChild(title);
    spanItem.appendChild(priceElement);
    spanItem.appendChild(toggleSelector);
    listItem.appendChild(spanItem);

    document.getElementById('cartList').appendChild(listItem);
  });

  total = total.toFixed(2);
  const totalText = document.getElementById('priceTitle');
  totalText.innerText = `Total: ${total}€`;

  const deleteButton = document.getElementById('deleteButton');
  deleteButton.addEventListener('click', function (e) {
    const deleteAllButton = document.getElementById('allSelector');
    if (deleteAllButton.classList.contains('active')) {
      emptyCart();
    } else {
      const toggles = document.querySelectorAll(
        '.toggleSelector:not(#allSelector)'
      );

      toggles.forEach(function (toggle) {
        if (toggle.classList.contains('active')) {
          const parent = toggle.parentElement.parentElement;
          const identifier = {
            id: parent.getAttribute('data-id'),
            type: parent.getAttribute('data-type'),
          };
          const price =
            toggle.parentElement.parentElement.getAttribute('data-price');
          removeItemFromCart(identifier, price);
          checkEmptyCart();
        }
      });
    }
  });

  const toggles = document.querySelectorAll(
    '.toggleSelector:not(#allSelector)'
  );

  toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      toggle.classList.toggle('active');

      //remove the allSelector active class if it is active
      const allSelector = document.getElementById('allSelector');
      if (allSelector.classList.contains('active')) {
        allSelector.classList.remove('active');
      }
    });
  });

  const allSelector = document.getElementById('allSelector');
  allSelector.addEventListener('click', function (e) {
    allSelector.classList.toggle('active');

    if (allSelector.classList.contains('active')) {
      toggles.forEach(function (toggle) {
        toggle.classList.add('active');
      });
    } else {
      toggles.forEach(function (toggle) {
        toggle.classList.remove('active');
      });
    }
  });

  if (total > 0) {
    //TODO
  } else if (cart.length > 0) {
    console.log(cart);

    //remove the second step (payment since it's free)
    document.querySelector('.selectorArrow').remove();
    document.querySelector('.stepSelector').remove();

    const checkoutFreeEventsButton = document.querySelector(
      '.nextStepButton.checkout'
    );
    checkoutFreeEventsButton.innerText = "S'inscrire gratuitement";
    //remove previous event listeners
    checkoutFreeEventsButton.removeEventListener('click', updateTitle);
    checkoutFreeEventsButton.addEventListener('click', () => {
      checkout(cart);
    });

    // document.getElementById('priceTitle').remove();
    // document.querySelector('.actionContainer').style.justifyContent = 'center';
  }
  checkEmptyCart();
}

function checkout(listOfItems) {
  fetch('/api/payment/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: listOfItems,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        userAlertGood('Achat réussi !');
        setTimeout(() => {
          window.location.href = '/account';
        }, 1000);
      } else if (data.error) {
        userAlert(data.error);
      } else {
        userAlert('Une erreur est survenue');
      }
    });
}

function emptyCart() {
  fetch('/removeItemFromCartPort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'all',
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        userAlertGood('Panier vidé');

        //update the cartButton
        const cartButton = document.getElementById('cartButton');
        cartButton.style.removeProperty('--number');

        const toggles = document.querySelectorAll(
          '.toggleSelector:not(#allSelector)'
        );
        toggles.forEach(function (toggle) {
          toggle.parentElement.parentElement.remove();
        });
        checkEmptyCart();
      } else {
        userAlert('Une erreur est ');
      }
    });
}

function removeItemFromCart(id, price) {
  fetch('/removeItemFromCartPort', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        userAlertGood('Item supprimé du panier');

        document
          .getElementById('cartList')
          .querySelector(`[data-id="${id.id}"][data-type="${id.type}"]`)
          .remove();

        const cartButton = document.getElementById('cartButton');

        if (data.cartSize > 0) {
          cartButton.style.setProperty('--number', `'${data.cartSize}'`);
        }

        //update total
        const totalText = document.getElementById('priceTitle');

        const total = totalText.innerText.split(' ')[1].split('€')[0];
        let newTotal = total - price;
        newTotal = newTotal.toFixed(2);
        totalText.innerText = `Total: ${newTotal}€`;

        if (newTotal === 0) {
          //check if the cart is empty
          fetch('/api/user/getCartItems', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                cart = data.items;
                if (cart.length === 0) {
                  checkEmptyCart();
                } else {
                  //show free checkout button
                  console.log(cart);
                  const checkoutFreeEventsButton = document.querySelector(
                    '.nextStepButton.checkout'
                  );

                  checkoutFreeEventsButton.innerText =
                    "S'inscrire gratuitement";
                  checkoutFreeEventsButton.addEventListener('click', () => {
                    checkout(cart);
                  });
                }
              } else {
                userAlert('Une erreur est survenue');
              }
            });
        }
      } else {
        userAlert('Une erreur est survenue');
      }
    });
}
