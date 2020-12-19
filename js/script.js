$(document).ready(function() {
    
    // Load list of saved cities
    var savedCities;
    if (localStorage.getItem("savedCities")) {
        savedCities = JSON.parse(localStorage.getItem("savedCities"));
    } else {
        savedCities = [];
    }

    renderSavedCities();

    function renderSavedCities() {
        if (savedCities.length === 0) { return; }

        var listContainer = $("#search-history-list");
        for (var i = savedCities.length - 1; i >= 0; i--) {
            var newListItem = $("<li>").text(savedCities[i]);
            newListItem.addClass("list-group-item");
            listContainer.append(newListItem);
        }
    }

    // Event listener for the search button
    $("#search-btn").click(function(event) {
        event.preventDefault();
        
        var query = $("#search-field").val();
        $("#search-field").val("");
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + query + 
            "&units=imperial&APPID=4123b80b67c88531547b1bdd29d80fd3";
        
        $.ajax({url: queryURL, method: "GET"}).then(function(response) {
            // Add new searched city to list in local storage
            savedCities.push(response.name);
            localStorage.setItem("savedCities", JSON.stringify(savedCities));

            // Add new searched city to list group
            var newListItem = $("<li>").text(response.name);
            markAllInactive();
            newListItem.addClass("list-group-item active");
            $("#search-history-list").prepend(newListItem);
            loadWeatherData(response);

            console.log(response);
        });

    });

    // Event listener for selecting a location from the saved searches list
    $(document).on("click", ".list-group-item", function(event) {
        event.preventDefault();

        // Set clicked list item to 'active'
        var target = $(event.target);
        markAllInactive();
        target.addClass("active");
        var clickedCity = target.text();

        // Get weather data and load it to the appropriate fields
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + clickedCity +
            "&units=imperial&APPID=4123b80b67c88531547b1bdd29d80fd3";
        $.ajax({ url: queryURL, method: "GET" }).then(function (response) {
            console.log(response);
            loadWeatherData(response);
        });
    });

    // Utility function to load data from an API response into the appropriate fields on the page
    function loadWeatherData(response) {
        var temp = response.main.temp;
        var humidity = response.main.humidity;
        var windSpeed = response.wind.speed;
        var uvIndex;

        $("#city-name-header").text(response.name);
        $("#temp").text(temp + "degF");
        $("#humidity").text(humidity + "%");
        $("#wind-speed").text(windSpeed + " mph");
    }

    // Removes 'active' class from all items in saved search list
    function markAllInactive() {
        var listItems = $("#search-history-list").children();
        for (var i = 0; i < listItems.length; i++) {
            $(listItems[i]).removeClass("active");
        }
    }
});