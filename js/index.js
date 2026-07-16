const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const word = document.getElementById('word');
const partOfSpeech = document.getElementById('part-of-speech');
const definition = document.getElementById('definition');
const example = document.getElementById('example');
const pronunciation = document.getElementById('pronunciation');
const synonym = document.getElementById('synonym');
const sourceLink = document.getElementById('source-link');
const audio = document.getElementById('audio');
const favList = document.getElementById('favourites-list');
const emptyFav = document.getElementById('empty-favourites');
const result = document.getElementById('result'); 

//the local storage stores data as a a string used  for storing the favourite words
//JSON now converts the string to an array when it is passed to javascript
let favourites = JSON.parse(localStorage.getItem('wordlyFavs')) || [];

document.addEventListener('DOMContentLoaded', renderFavourites);

//addEventListener listens to the submit form when the user clicks the search button
//the preventDefault prevents the page from reloading
//when the user type  nothing it will display an error message 
// if the user typed a word we use fetchWord to request to the Dictionary API
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const searchTerm = input.value.trim();
  if (searchTerm === '') {
    error.textContent = 'Please enter a word';
    return;
  }
  fetchWord(searchTerm); 
})
//Used a function fetchWord where the user search for the word frrom the API
function fetchWord(wordToSearch) {
  setLoading(true);
  clearError();//removes the older messages
  clearResult();//removes the previous word

  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToSearch}`)
   .then(res => {
      if (!res.ok) throw new Error('We could not find the word. Check spelling and try again'); 
      return res.json();
    })
   .then(data => {
      setLoading(false);
      displayWord(data[0]);
    })
   .catch(err => {
      setLoading(false);
      displayError(err.message);
    })
}
//It displays the information about the word
function displayWord(data) {
  const meaning = data.meanings[0];//gets the meaning of the word

  const def = meaning.definitions[0];//gets the definition of the word

  word.innerText = data.word;
  //it gets every speech from the API and joins them into one string
  const allParts = data.meanings.map(m => m.partOfSpeech).join(', ');

  partOfSpeech.innerText = allParts;//displays all the partsOfSpeech

  definition.innerText = def.definition;//it shows an example if there is no example display an default message
  example.innerText = def.example || 'No example available';

  //displays the example message if there is no example show 'N/A'
  pronunciation.innerText = data.phonetic || 'N/A';

// It Combines synonyms from,definition,meaning,if it does not exist display an empty array
  const allSynonyms = [...(def.synonyms || []),...(meaning.synonyms || [])];

//joins the synonym into one string and if there is no synonym display none
  synonym.innerText = allSynonyms.length > 0? [...new Set(allSynonyms)].join(', ') : 'None';

  //
  if (data.sourceUrls && data.sourceUrls[0]) {//it checks if the API returned the url
    sourceLink.href = data.sourceUrls[0];//it puts the URL into the link
    sourceLink.hidden = false;//Makes the link visible
  }
// it looks through  pronunciation objects in the API after that 
//if the object is found the audio gets the audio property
const audioUrl = data.phonetics.find(p => p.audio)?.audio;


if (audioUrl) { // checks if the audio url is found
  const fixedUrl = audioUrl.startsWith('//') ? 'https:' + audioUrl : audioUrl;//it adds 'https' to make the url valid if it begins with '//'

  audio.src = fixedUrl;// Sets the audio player source to the pronunciation file
  audio.hidden = false;//it makes the audio visible
} else {
  audio.src = ''; //if there is no audio that exist remove the previous audio
  audio.hidden = true;//hides the audio coz there is no audio tha plays
}

  addSaveButton(data.word);//it creates and display the favourites button
}

function setLoading(isLoading) { //it prevents multiple clicks
  loading.textContent = isLoading? 'Loading...' : ''; //if loading is true display 'loading' if its not true display remove the loading
  //
  form.querySelector('button').disabled = isLoading;//disables the button when the loading continues nad enabling it when it finishes
}

function displayError(message) {
  error.textContent = message; //Puts the error message inside the error element
}
//it clears the previous error message
function clearError() {
  error.textContent = '';//it removes the text from the error element
}
//here it clears the previous information
function clearResult() {
  word.textContent = '';
  partOfSpeech.textContent = '';
  definition.textContent = '';
  example.textContent = '';
  pronunciation.textContent = '';
  synonym.textContent = '';
  sourceLink.hidden = true;
  audio.src = '';
  audio.hidden = true;
  const oldBtn = document.getElementById('save-btn');//checks for an existing button on the page
  if (oldBtn) {
    oldBtn.remove();
  }
}

function addSaveButton(wordToSave) { //creates a Save button for the current word
  const btn = document.createElement('button'); //creates a new button element
  btn.id = 'save-btn';
  btn.style.marginTop = '15px';//adds some space above the button

  if (favourites.includes(wordToSave.toLowerCase())) {
    btn.textContent = 'Saved';// If the word is  saved it will display saved
  } else {
    btn.textContent = 'Add to Favourites';// if not  saved  it tells it to save
  }

  btn.onclick = function() { //it tells the button what to do when it is clicked
    toggleFavourite(wordToSave);
  };

  result.appendChild(btn); // it makes the button appear on the web
}

function toggleFavourite(wordToSave) {  //removes the words from the favourite list
  wordToSave = wordToSave.toLowerCase(); //converts the words to lowercase
  if (favourites.includes(wordToSave)) { //if the word exists
    favourites = favourites.filter(w => w!== wordToSave); //Checks if the favourites array already contains this word
  } else {
    favourites.push(wordToSave); //If it doesn't exist, add it to the favourites array
  }
  localStorage.setItem('wordlyFavs', JSON.stringify(favourites));
  renderFavourites();
  addSaveButton(wordToSave);
}

function renderFavourites() {
  favList.innerHTML = '';//clears the favourites lists before displaying it again
  if (favourites.length === 0) { //checks if the favourites array is empty
    emptyFav.style.display = 'block';
  } else {
    emptyFav.style.display = 'none';
    favourites.forEach(favWord => { //loops through every item in an array
      const li = document.createElement('li');//creates a list item for each one
      li.textContent = favWord;
      li.style.cursor = 'pointer';
      li.style.padding = '5px 0';
      li.onclick = () => { input.value = favWord; fetchWord(favWord); };
      favList.appendChild(li);
    });
  }
}