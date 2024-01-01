const EDAMAM_API_ID = ""; // Add your Edamam API ID here
const EDAMAM_API_KEY = ""; // Add your Edamam API key here
const YOUTUBE_API_KEY = ""; // Add your YouTube API key here
const SPOONACULAR_API_KEY = ""; // Add you Spoonacular API key here
let recipes = [];
let videos = [];
let selectedRecipe = null;

$(document).ready(function () {
  // Attach a click event handler to the images with id 'logo' and 'name'
  $("#logo, #name").on("click", function () {
    // Reload the page when either of the images is clicked
    location.reload();
  });

  // Event handler function for the form submission event (when the user submits a search query).
  $("#searchForm").submit(function (event) {
    event.preventDefault();
    const searchInput = $("#searchInput").val();
    fetchRecipes(searchInput);
    fetchVideos(searchInput);
    createRefinementForm();
  });

  // Tab One - Recipe Search: Display recipes from Edamam's database based on user's queries such as "pasta", "chicken", etc.

  /**
   * Asynchronous function to fetch recipes from the Edamam Recipe Search API based on the provided search input.
   * @param {string} searchInput - The search query for recipes.
   * @throws {Error} If there is an error during the API request.
   */
  async function fetchRecipes(searchInput) {
    try {
      // Initialize variables to keep track of the current page, total pages, and fetched recipes.
      let currentPage = 0, totalPages = 1, recipes = [];
  
      $("#recipeSearch").html("<p>Please wait, loading recipes...</p>");
  
      // Fetch recipes in chunks of 8 items until all pages are fetched.
      while (currentPage < totalPages) {
        const response = await fetch(`https://api.edamam.com/search?q=${searchInput}&app_id=${EDAMAM_API_ID}&app_key=${EDAMAM_API_KEY}&from=${currentPage * 8}&to=${(currentPage + 1) * 8}`);
        const data = await response.json();
  
        if (data && data.hits) {
          recipes.push(...data.hits.map(hit => hit.recipe));
          totalPages = Math.ceil(data.count / 8); // Calculate total pages based on total count.
          currentPage++; // Move to the next page of results.
        } else break; // No more pages, exit the loop.
      }
  
      recipes.length > 0 ? displayRecipeSearchResults(recipes) : $("#recipeSearch").html("<p>No recipes found. Please try a different search.</p>");
    } catch (error) {
      console.error("Error fetching recipes:", error);
      $("#recipeSearch").html("<p>Error fetching recipes.</p>");
    }
  }

  /**
   * Displays a section of recipe cards based on the given recipes array and current page number.
   * @param {Array} recipes - An array of recipe objects to be displayed.
   * @param {number} currentPage - The current page number, default is 1.
   */
  function displayRecipeSearchResults(recipes, currentPage = 1) {
    const recipesPerPage = 8, startIndex = (currentPage - 1) * recipesPerPage, endIndex = startIndex + recipesPerPage;
    const currentRecipes = recipes.slice(startIndex, endIndex);
    const recipeSearchTab = $("#recipeSearch").empty();
  
    if (currentRecipes.length === 0) {
      recipeSearchTab.html("<p>No recipes found. Please try a different search.</p>");
    } else {
      const recipeSection = $("<div>").addClass("recipes-section");
  
      // Iterate through the current recipes and create recipe cards
      currentRecipes.forEach(recipe => {
        const recipeCard = $("<div>").addClass("recipe-card").on("click", () => handleRecipeSelection(recipe.uri, recipes));
        const imageContainer = $("<div>").addClass("recipe-image").append($("<img>").attr({src: recipe.image, alt: recipe.label}));
        const recipeDetails = $("<div>").addClass("recipe-details").append($("<h3>").text(recipe.label), $("<p>").text(`${recipe.cuisineType} • ${recipe.mealType}`));
        recipeCard.append(imageContainer, recipeDetails);
        recipeSection.append(recipeCard);
      });
  
      recipeSearchTab.append(recipeSection);
      addPaginationControls(recipes.length, recipes, currentPage);
    }
  }

  /**
   * Adds pagination controls to navigate through recipe search results.
   * @param {number} totalResults - The total number of search results (recipes) to be paginated.
   * @param {Array} recipes - An array of recipe objects to be displayed.
   * @param {number} currentPage - The current page of recipes being displayed.
   */
  function addPaginationControls(totalResults, recipes, currentPage) {
    const recipesPerPage = 8;
    const totalPages = Math.ceil(totalResults / recipesPerPage);
    const paginationContainer = $("<div>").attr({"aria-label": "Recipe Pagination", id: "pagination"}).addClass("mt-4");
    const paginationList = $("<ul>").addClass("pagination justify-content-center").append(Array.from({ length: totalPages }, (_, index) => {
      const page = index + 1;
      const paginationItem = $("<li>").addClass("page-item" + (page === currentPage ? " active" : ""));
      const paginationLink = $("<a>").addClass("page-link").attr("href", "#").text(page);
  
      // Attach click event to pagination link to display recipes for the selected page
      paginationLink.on("click", event => {
        event.preventDefault();
        displayRecipeSearchResults(recipes, page);
      });
  
      return paginationItem.append(paginationLink);
    }));
  
    paginationContainer.append(paginationList);
    $("#recipeSearch").append(paginationContainer);
  }

  /**
   * Handles the selection of a specific recipe based on its URI and displays its details.
   * @param {string} recipeUri - The URI of the selected recipe.
   * @param {Array} recipes - An array of recipe objects to search for the selected recipe.
   */
  function handleRecipeSelection(recipeUri, recipes) {
    const selectedRecipe = recipes.find(recipe => recipe.uri === recipeUri); // Find the selected recipe in the provided array of recipes
    const recipeSection = $(".recipes-section");
  
    if (selectedRecipe) {
      recipeSection.addClass("blur"); // Apply a blur effect to the recipe section
      displaySelectedRecipe(selectedRecipe); // Display the details of the selected recipe
    } else console.error("Selected recipe data is missing.");
  }

  /**
   * Display a more detailed recipe card about the selected recipe in a modal.
   * @param {Object} selectedRecipe - The selected recipe object containing its details.
   */
  function displaySelectedRecipe(selectedRecipe) {
    const { label, image, mealType, cuisineType, healthLabels, dietLabels, calories, url } = selectedRecipe;
  
    $("#recipeTitle").text(label);
    $("#recipeImage").attr("src", image);
    $("#recipeDetails").html(`${mealType} • ${cuisineType} • ${Math.round(calories)} cal<br>${healthLabels.join(" • ")}<br>${dietLabels.join(" • ")}`);
    $("#recipeLink").attr({ href: url, target: "_blank", rel: "noopener"}).text(url);
  
    // Display the modal using Bootstrap modal functionality
    const recipeModal = new bootstrap.Modal($("#recipeModal"));
    recipeModal.show();
  }

  // Tab Two - Recipe Videos: Display videos from YouTube based on user's query

  /**
   * Asynchronous function to fetch videos from YouTube API based on the provided search input.
   * @param {string} searchInput - The search query for videos.
   * @throws {Error} If there is an error during the API request.
   */
  async function fetchVideos(searchInput) {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&part=snippet&maxResults=50&q=${searchInput} recipes&type=video`);
      const data = await response.json();
      const videos = data.items || [];

      if (videos.length > 0) {
        displayVideos(videos);
      } else {
        $("#recipeVideos").html("<p>No videos found. Please try a different search.</p>");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      $("#recipeVideos").html("<p>Error fetching videos.</p>");
    }
  }

  /**
   * Displays a section of video cards based on the given videos array and starting index.
   * @param {Array} videos - An array of video objects to be displayed.
   * @param {number} startIndex - The starting index of videos to be displayed, default is 0.
   */
  function displayVideos(videos, startIndex = 0) {
    const endIndex = startIndex + 6;
    const currentVideos = videos.slice(startIndex, endIndex); // Extract videos for the current display range
    $("#recipeVideos").empty().append($("<div>").addClass("video-section"));
  
    // Iterate through the current videos and create video cards
    currentVideos.forEach(item => {
      const videoCard = $("<div>").addClass("video-card").click(() => window.open(`https://www.youtube.com/watch?v=${item.id.videoId}`, "_blank"));
      videoCard.append($("<div>").addClass("video-image").append($("<img>").attr({ src: item.snippet.thumbnails.medium.url, alt: item.snippet.title })));
      videoCard.append($("<div>").addClass("video-details").append($("<h3>").text(item.snippet.title), $("<p>").text(item.snippet.description)));
      $("#recipeVideos .video-section").append(videoCard);
    });
  
    addVideoPaginationControls(videos, startIndex);
  }

  /**
 * Adds pagination controls for navigating through video search results.
 * @param {Array} videos - An array of video objects to be paginated.
 */
  function addVideoPaginationControls(videos) {
    const totalPages = Math.ceil(videos.length / 6);
    const paginationContainer = $("<div>").attr({ "aria-label": "Video Pagination", id: "pagination" }).addClass("mt-4");
    const paginationList = $("<ul>").addClass("pagination justify-content-center");
  
    // Iterate through total pages and create pagination items with click functionality
    for (let page = 1; page <= totalPages; page++) {
      const paginationItem = $("<li>").addClass("page-item");
      const paginationLink = $("<a>").addClass("page-link").attr("href", "#").text(page).click(event => {
        event.preventDefault();
        const startIndex = (page - 1) * 6;
        displayVideos(videos, startIndex);
      });
      paginationItem.append(paginationLink);
      paginationList.append(paginationItem);
    }
  
    paginationContainer.append(paginationList);
    $("#recipeVideos").append(paginationContainer);
  }

  /* Tab Three - Random Recipe Generator
    Displays four (if there are enough recipes in the database that match) random recipes from Spoonacular's database based on user query.
    Users have the option to refine their search further to get more personalized results.
    Uses second degree web service composition to retrive detailed information about recipes:
      1. Spoonacular's Complex Search API is used to obtain random recipes
      2. We use this output to retrieve the ID of the recipe, and use it to initiate a request to
         Spoonacular's Summary API to retrive a summarized recipe to display to users.
  */

  const cuisineArray = [
    "African",
    "Asian",
    "American",
    "British",
    "Cajun",
    "Caribbean",
    "Chinese",
    "Eastern European",
    "European",
    "French",
    "German",
    "Greek",
    "Indian",
    "Irish",
    "Italian",
    "Japanese",
    "Jewish",
    "Korean",
    "Latin American",
    "Mediterranean",
    "Mexican",
    "Middle Eastern",
    "Nordic",
    "Southern",
    "Spanish",
    "Thai",
    "Vietnamese",
  ];

  const allergyArray = [
    "Dairy",
    "Egg",
    "Gluten",
    "Grain",
    "Peanut",
    "Seafood",
    "Sesame",
    "Shellfish",
    "Soy",
    "Sulfite",
    "Tree Nut",
    "Wheat",
  ];

  /**
   * Creates checkboxes for each option and appends them to the specified container.
   * @param {Array} options - An array of options for the checkboxes.
   * @param {HTMLElement} container - The HTML element to which checkboxes will be appended.
   * @param {string} name - The name attribute for the checkboxes.
   * @returns {void}
   */
  function createCheckboxes(options, container, name) {
    options.forEach((option) => {
      $("<div>").addClass("form-check").appendTo(container)
      .append($("<input>").attr({type: "checkbox", name: name, value: option}).addClass("form-check-input"))
      .append($("<label>").addClass("form-check-label").attr("for", name + option).text(option));
    });
  }

  /**
   * Creates a form for refining search options, including cuisine and allergy checkboxes.
   * @returns {void} - The function does not return a value.
   */
  function createRefinementForm() {
    $("#randomRecipes").empty();
    const refinementForm = $("<form>").addClass("container mt-4").attr("id", "refineForm");
    $("<h3>").addClass("text-center").text("Refine your search (optional)").appendTo(refinementForm);
    $("<p>").addClass("text-center").text("Press submit to continue").appendTo(refinementForm);
    
    // Create checkboxes for cuisine options
    $("<div>").addClass("form-group-title").text("Cuisines").appendTo(refinementForm);
    const cuisineOptionsContainer = $("<div>").addClass("form-group").attr("id", "cuisineOptions").appendTo(refinementForm);
    createCheckboxes(cuisineArray, cuisineOptionsContainer, "cuisine");
    
    // Create checkboxes for allergy options
    $("<div>").addClass("form-group-title").text("Allergies").appendTo(refinementForm);   
    const allergyOptionsContainer = $("<div>").addClass("form-group").attr("id", "allergyOptions").appendTo(refinementForm);
    createCheckboxes(allergyArray, allergyOptionsContainer, "allergy");

    refinementForm.append($("<button>").addClass("btn btn-primary").attr("id", "submitBtn").text("Submit"));
    
    $("#randomRecipes").append(refinementForm);
    
    // Attach click event to the submit button to fetch random recipes based on selected options
    $("#submitBtn").on("click", function (event) {
      event.preventDefault();
      // Get selected checkboxes
      selectedCuisines = Array.from(
        document.querySelectorAll("input[name=cuisine]:checked")
      ).map((checkbox) => checkbox.value);
      selectedAllergies = Array.from(
        document.querySelectorAll("input[name=allergy]:checked")
      ).map((checkbox) => checkbox.value);
      fetchRandomRecipes(selectedCuisines, selectedAllergies);
    });
  }

  /**
   * Asynchronous function to fetch random recipes from Spoonacular's Complex Search API based on selected cuisines and allergies.
   * @param {Array} selectedCuisines - An array of selected cuisine types.
   * @param {Array} selectedAllergies - An array of selected allergy types.
   * @throws {Error} If there is an error during the API request.
   * @returns {Promise<void>} - A Promise that resolves when the recipes are fetched and displayed.
   */
  async function fetchRandomRecipes(selectedCuisines, selectedAllergies) {
    try {
      const searchQuery = $("#searchInput").val();
      const apiUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${searchQuery}&cuisine=${selectedCuisines}&intolerances=${selectedAllergies}&sort=random&number=4`;
      
      const response = await $.ajax({
        url: apiUrl,
        method: "GET",
      });

      displayRandomRecipes(response.results);
    } catch (error) {
      console.error("Error fetching Spoonacular recipes:", error);
    }
  }

  /**
   * Displays a section of random recipe cards.
   * @param {Array} recipes - An array of random recipe objects to be displayed.
   * @returns {void}
   */
  function displayRandomRecipes(recipes) {
    const randomRecipeTab = $("#randomRecipes").empty();
    const recipeSection = $("<div>").addClass("recipes-section");

    if (recipes.length == 0) {
      randomRecipeTab.html("<p>No recipes found. Please try a different search.</p>");
    }

     // Iterate through the random recipes and create recipe cards
    recipes.forEach((recipe) => {
      const recipeCard = $("<div>").addClass("recipe-card").on("click", function () {
        handleRandomRecipeSelection(recipe);
      });
      const imageContainer = $("<div>").addClass("recipe-image").append(
        $("<img>").attr({src: recipe.image, alt: recipe.title})
      );

      const recipeDetails = $("<div>").addClass("recipe-details").append(
        $("<h3>").text(recipe.title),
      );

      recipeCard.append(imageContainer, recipeDetails);
      recipeSection.append(recipeCard);
      });
    
    randomRecipeTab.append(recipeSection);
  }

  /**
   * Handles the selection of a random recipe card and displays its details in a modal.
   * @param {Object} selectedRecipe - The selected recipe object containing its details.
   * @returns {void}
   */
  function handleRandomRecipeSelection(selectedRecipe) {
    $("#recipeTitle").text(selectedRecipe.title);
    $("#recipeImage").attr("src", selectedRecipe.image);
    $("#recipeLink").attr({ "href": selectedRecipe.url, target: "_blank", rel: "noopener" })
      .text(selectedRecipe.url);

    // Display the modal
    const recipeModal = new bootstrap.Modal($("#recipeModal"));
    recipeModal.show();

    fetchSummarizedRecipe(selectedRecipe.id);
  }

  /**
   * Asynchronous function to fetch from Spoonacular's Summary API and display summarized recipe details based on the given recipe ID.
   * @param {number} recipeID - The ID of the recipe to fetch the summary for.
   * @throws {Error} If there is an error during the API request.
   * @returns {Promise<void>} - A Promise that resolves when the summarized recipe details are fetched and displayed.
   */
  async function fetchSummarizedRecipe(recipeID) {
    $("#recipeDetails").html("<p>Please wait, loading summary...</p>");
    try {
      const response = await fetch(`https://api.spoonacular.com/recipes/${recipeID}/summary?apiKey=${SPOONACULAR_API_KEY}`);
      const data = await response.json();
      $("#recipeDetails").html(`${data.summary}`);
    } catch (error) {
      console.error("Error fetching summarized recipe:", error);
    }
  }
});