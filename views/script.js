var cartItems = []; // Store booking details in an array

        document.getElementById("booking-form").addEventListener("submit", function (event) {
            event.preventDefault();

            // Retrieve values from form
            var selectedItems = document.getElementById("timeslot").selectedOptions;
            var items = Array.from(selectedItems).map(option => option.value);

            var date = document.getElementById("date").value;

            // Create a new cart item object for each selected item
            for (var i = 0; i < items.length; i++) {
                var option_value = items[i].split("|");
                var newItem = {
                    start_time: option_value[0],
                    end_time: option_value[1],
                    price: option_value[2],
                    date: date
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
        
            if (cartItems.length == 0) {
                cartItemsDiv.innerHTML = "Cart is empty.";
            } else {
                // Display each item in the cart
                for (var i = 0; i < cartItems.length; i++) {
                    var cartItem = cartItems[i];
                    var cartItemDiv = document.createElement("div");
                    cartItemDiv.innerHTML = `
                        <div class="cart-item">
                            <h3>Booking Details<button id=new onclick="removeItem(${i})">Remove</button></h3>
                            <p>Time : ${cartItem.start_time} to ${cartItem.end_time}</p>
                            <p>Price: ${cartItem.price}</p>
                            <p>Date: ${cartItem.date}</p>
                            <button id=new onclick="submitCartItem(${i})">Submit</button>
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
// updateCartDisplay();

// submit cart item storage

function submitCartItem(index) {
    var itemToSubmit = cartItems[index];
    console.log("Submitting the following item to the console:");
    console.log(itemToSubmit);

    // You can optionally send this data to a server or perform other actions here

    // Optionally mark the item as submitted (you can add a property to the item)
    itemToSubmit.submitted = true;

    // Update the cart display to reflect the change (e.g., add a submitted flag)
    updateCartDisplay();
}
