$(document).ready(function() {
    
    // Load list of saved cities from local storage
    var savedCities;
    if (localStorage.getItem("savedCities")) {
        savedCities = JSON.parse(localStorage.getItem("savedCities"));
    } else {
        savedCities = [];
    }

    renderSavedCities();

    var lastViewed;
    if (localStorage.getItem("lastViewed")) {
        lastViewed = localStorage.getItem("lastViewed");
        loadWeatherData(lastViewed);
        var lastViewedInList = $(`.list-group-item:contains(${lastViewed})`);
        markAllInactive();
        lastViewedInList.addClass("active");
    }

    // Draw list of saved cities below search bar
    function renderSavedCities() {
        if (savedCities.length === 0) { return; }

        var listContainer = $("#search-history-list");
        for (var i = savedCities.length - 1; i >= 0; i--) {
            var newListItem = $("<li>").text(savedCities[i]);
            newListItem.addClass("list-group-item");
            listContainer.append(newListItem);
        }
    }

    // Event listener for the search form submission
    $("#search-form").submit(function(event) {
        event.preventDefault();
        
        var query = $("#search-field").val();
        var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + query +
            "&units=imperial&APPID=4123b80b67c88531547b1bdd29d80fd3";

        localStorage.setItem("lastViewed", query);

        // Submit an API request just to see if the value in the search box is a valid city identifier
        $.ajax({ 
            url: queryURL, 
            method: "GET", 
            error: function(ajaxContext) { 
                console.log("Invalid city identifier")
            }
        }).then(function(response) {
            // If successful, run the actual API requests
            //      (this technically involves a redundant API request, but I couldn't figure out
            //       an efficient way to validate the input in the text field)
            loadWeatherData(query);

            var capitalizedCityName = query[0].toUpperCase();
            capitalizedCityName += query.substring(1, query.length);
            savedCities.push(capitalizedCityName);
            localStorage.setItem("savedCities", JSON.stringify(savedCities))

            // Add new searched city to list group
            var newListItem = $("<li>").text(capitalizedCityName);
            markAllInactive();
            newListItem.addClass("list-group-item active");
            $("#search-history-list").prepend(newListItem);
        });

        $("#search-field").val(""); // Empty search field

    });

    // Event listener for selecting a location from the saved searches list
    $(document).on("click", ".list-group-item", function(event) {
        event.preventDefault();

        // Set clicked list item to 'active'
        var target = $(event.target);
        localStorage.setItem("lastViewed", target.text());
        markAllInactive();
        target.addClass("active");
        loadWeatherData(target.text());
    });

    // Utility function to submit API requests for all data to populate page
    function loadWeatherData(clickedCity) {

        var todaysWeatherURL = "https://api.openweathermap.org/data/2.5/weather?q=" + clickedCity +
            "&units=imperial&APPID=4123b80b67c88531547b1bdd29d80fd3";

        $.ajax({ 
            url: todaysWeatherURL, 
            method: "GET",
        }).then(function (response) {
            var date = moment.unix(response.dt);
            var dateStr = `(${date.month() + 1}/${date.date()}/${date.year()})`;

            var temp = Math.round(parseFloat(response.main.temp) * 10) / 10;
            var humidity = response.main.humidity;
            var windSpeed = response.wind.speed;

            // Submit a second API request for UV index data
            var uvIndexURL =
                "http://api.openweathermap.org/data/2.5/uvi?lat=" + response.coord.lat +
                "&lon=" + response.coord.lon +
                "&appid=4123b80b67c88531547b1bdd29d80fd3";

            $.ajax({ url: uvIndexURL, method: "GET"}).then(function(response) {
                var uvIdxEl = $("#uv-index");
                uvIdxEl.text(response.value);
                if (response.value < 2) {
                    // low (green)
                    uvIdxEl.removeClass();
                    uvIdxEl.addClass("uv-low");
                } else if (response.value < 6) {
                    // moderate (yellow)
                    uvIdxEl.removeClass();
                    uvIdxEl.addClass("uv-moderate");
                } else if (response.value < 8) {
                    // high (orange)
                    uvIdxEl.removeClass();
                    uvIdxEl.addClass("uv-high");
                } else if (response.value < 11) {
                    // very high (red) 
                    uvIdxEl.removeClass();
                    uvIdxEl.addClass("uv-very-high");
                } else {
                    // extreme (purple)
                    uvIdxEl.removeClass();
                    uvIdxEl.addClass("uv-extreme");
                }
            });

            // Populate response data in respective fields
            $("#weather-icon-main").attr("src", pickIcon(response.weather[0].icon));
            $("#weather-icon-main").attr("height", "200");
            $("#weather-icon-main").attr("width", "200");

            $("#city-name-header").text(response.name + " " + dateStr);
            $("#temp").html(temp + "&deg;F");
            $("#humidity").text(humidity + "%");
            $("#wind-speed").text(windSpeed + " mph");
        });

        var forecastURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + clickedCity +
            "&units=imperial&appid=4123b80b67c88531547b1bdd29d80fd3";

        $.ajax({url: forecastURL, method: "GET"}).then(function(response) {

            for (var i = 0; i < 5; i++) {
                var dateRaw = moment.unix(response.list[(i * 8) + 1].dt);
                var dateStr = `${dateRaw.month() + 1}/${dateRaw.date()}/${dateRaw.year()}`;
                var temp = Math.round(parseFloat(response.list[i].main.temp) * 10) / 10;
                var humidity = response.list[i].main.humidity;
                var iconCode = response.list[i].weather[0].icon;

                var card = $(`div[data-idx=${i}]`);
                var cardTitle = card.find(".card-title");
                var cardIcon = card.find(".card-icon");
                var cardTemp = card.find(".card-temp");
                var cardHumid = card.find(".card-humid");
                
                cardTitle.text(dateStr);
                cardIcon.attr("src", pickIcon(iconCode));
                cardIcon.attr("height", 50);
                cardIcon.attr("width", 50);
                cardTemp.html(`Temp: ${temp}&deg;F`);
                cardHumid.text(`Humidity: ${humidity}%`);
            }

        });

    }

    // Removes 'active' class from all items in saved search list
    function markAllInactive() {
        var listItems = $("#search-history-list").children();
        for (var i = 0; i < listItems.length; i++) {
            $(listItems[i]).removeClass("active");
        }
    }

    // Return URL for an icon based on OpenWeatherMap API's condition code
    function pickIcon(code) {
        var URLbase = "https://raw.githubusercontent.com/erikflowers/weather-icons/54113376d944f6735054ef3b38dcee755471f1b9/svg/";
        switch (code) {
            case "01d": // clear, day
                return URLbase + "wi-day-sunny.svg";
            case "01n": // clear, night
                return URLbase + "wi-moon-alt-waxing-crescent-2.svg";
            case "02d": // few clouds, day
                return URLbase + "wi-day-cloudy.svg";
            case "02n": // few clouds, night
                return URLbase + "wi-night-alt-cloudy.svg";
            case "03d": // scattered clouds
                return URLbase + "wi-cloud.svg";
            case "03n": // scattered clouds
                return URLbase + "wi-cloud.svg";
            case "04d": // broken clouds
                return URLbase + "wi-cloudy.svg";
            case "04n": // broken clouds
                return URLbase + "wi-cloudy.svg";
            case "09d": // shower rain
                return URLbase + "wi-day-showers.svg";
            case "09n": // shower rain, night
                return URLbase + "wi-night-showers.svg";
            case "10d": // rain
                return URLbase + "wi-day-rain.svg";
            case "10n": // rain, night
                return URLbase + "wi-night-rain.svg";
            case "11d": // thunderstorm
                return URLbase + "wi-day-thunderstorm.svg";
            case "11n": // thunderstorm, night
                return URLbase + "wi-night-thunderstorm.svg";
            case "13d": // snow
                return URLbase + "wi-day-snow.svg";
            case "13n": // snow
                return URLbase + "wi-night-snow.svg";
            case "50d": // mist
                return URLbase + "wi-day-fog.svg";
            case "50n": // mist, night
                return URLbase + "wi-night-fog.svg";
        }
    }
});