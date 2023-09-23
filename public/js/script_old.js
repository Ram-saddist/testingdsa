
  var cartItems = []; // Store booking details in an array

  document.getElementById("booking-form").addEventListener("submit", function (event) {
      event.preventDefault();

      // Retrieve values from form
      var selectedItems = document.getElementById("item").selectedOptions;
      var items = Array.from(selectedItems).map(option => option.value);
      var date = document.getElementById("date").value;
      var time = document.getElementById("time").value;
      var place = document.getElementById("place").value;
      var duration = document.getElementById("duration").value;

      // Create a new cart item object for each selected item
      for (var i = 0; i < items.length; i++) {
          var newItem = {
              item: items[i],
              date: date,
              time: time,
              place: place,
              duration: duration
          };

          // Add the item to the cart
          cartItems.push(newItem);
      }

      updateCartDisplay();

      // Clear the form
      document.getElementById("booking-form").reset();
  });

  function updateCartDisplay() {
      var cartItemsDiv = document.getElementById("cart-items");
      cartItemsDiv.innerHTML = ""; // Clear previous items

      if (cartItems.length === 0) {
          cartItemsDiv.innerHTML = "Cart is empty.";
      } else {
          // Display each item in the cart
          for (var i = 0; i < cartItems.length; i++) {
              var cartItem = cartItems[i];
              var cartItemDiv = document.createElement("div");
              cartItemDiv.innerHTML = `
                  <div class="cart-item">
                      <h3>Booking Details</h3>
                      <p>Item: ${cartItem.item}</p>
                      <p>Date: ${cartItem.date}</p>
                      <p>Time: ${cartItem.time}</p>
                      <p>Place: ${cartItem.place}</p>
                      <p>Duration (hours): ${cartItem.duration}</p>
                      <button onclick="removeItem(${i})">Remove</button>
                  </div>
              `;
              cartItemsDiv.appendChild(cartItemDiv);
          }
      }
  }

  function removeItem(index) {
      // Remove the item from the cart
      cartItems.splice(index, 1);
      updateCartDisplay();
  }

  // Initial cart display
  updateCartDisplay();
