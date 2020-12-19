$(document).ready(function() {
    
    // Load list of saved cities
    var savedCities;
    if (localStorage.getItem("savedCities")) {
        savedCities = localStorage.getItem("savedCities");
    } else {
        savedCities = [];
    }

    renderSavedCities();

    function renderSavedCities() {
        if (savedCities.length === 0) { return; }

        var listContainer = $("#search-history-list");
        for (var i = 0; i < savedCities.length; i++) {
            var newListItem = $("<li>").text(savedCities[i]);
            newListItem.addClass("list-group-item");
        }
    }

    $("#search-btn").click(function(event) {
        event.preventDefault();
    });

    $(document).on("click", ".list-group-item", function(event) {
        event.preventDefault();

        var clickedCity = event.target.textContent;
    });
});