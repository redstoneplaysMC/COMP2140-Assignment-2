# Readme

# AI Usage
ChatGPT was used as the primary AI for this assignment; it was used in coding the functions and planning out the program structure.
AI was especially useful in quickly creating the skeleton JSX format with natural language rather than directly coding it.
It was helpful with writing the API calls, and No API keys were pasted into the AI.
Finally, AI was used for the AI Slide generator and the Slide previewer sections.
Github Copilot's inline fill was used to autofill tedious code and commenting.

# API Keys (incase the .env did not work properly)
The following are the API keys that I used in the .env.
VITE_RESTAPI_LINK = https://comp2140-3ea651da.uqcloud.net/api
VITE_RESTAPI_ACCESS_TOKEN = eyJhbGciOiJIUzI1NiJ9.eyJraW5kIjoic3R1ZGVudCIsInVpZCI6MTA0MiwidmVyIjoxLCJpc3MiOiJ1cS1nZW5lcmFsLWFwaSIsInN1YiI6InM0NzAzNDM5IiwiaWF0IjoxNzg4OTM2NTIwLCJleHAiOjE4MjA0NzI1MjB9.SCwnQd7rsWGJQYK1PvvEeqU3yB1lv524-Ii5F1qAbCE
VITE_LANGCHAIN_KEY=sk-uq-CFB6gPtZ8RbrmhWWAXHIOLqkP2eZ6hK0
FRONTEND_URL=http://localhost:5173
VITE_OPENAI_MODEL = gpt-4o-mini
PORT = 3000

# Testing Guide
## Opening the site
Run 'npm run start' inside the directory with package.json to open the website on Localhost; both the front-end and server need to be running for functionality.
The front-end JSX can run without the server, but it will not be able to convert the markdown format to JSX, and AI slide creation will not work.
The templates in .env.example need to be filled with the link to the API and LangChain and saved as .env.

Click 'Create a presentation' to create a presentation. Fill in the details.
Edit the newly-created presentation by clicking on 'Edit presentation.'

To delete a presentation, click delete presentation. This will delete the server's record of the presentation, along with any
attendees, poll responses and slides relevant to the presentation.

The homepage has no URL extension, and is intended to be the starting point of the collaborator.

## Markdown Editor
Inside the Edit Slides page, there is a slide previewer a markdown editor and some debug formats.
To use the markdown previewer, if the server is running, after typing the desired markdown into the edit box,
it can be directly converted into a slide format (the intermediate steps are in the debug format dropdowns) by
pressing the convert to markdown button.

The format is like assignment 1. The test markdowns from that assignment can be pasted into the text field and converted into a slide.
A poll slide has the format:

---
<!--poll-->
{title}
{question}
{option1}
{option2}
{option3}

This is detected by the <!--poll--> string acting as a directive; the poll must exactly be this format, but can have
more than 3 options. The submit button will only work when a valid attendee is viewing the slides, and the answer is
saved as a string (two options with the same string will save as the same answer.)

After reviewing the slide and happy with it, the user can Save to API to save the presentation to the server, which
saves what is currently being displayed on the slide to the server. If modified, clicking Load from API will set it
to that state again.

## AI slides generation
The collaborator can add a slide with AI. Typing in a prompt and submitting will communicate with the server, then
adding the resulting slide to the end of the markdown.
The AI model is OpenAI GPT 4o-mini, as this was one of the models described in the LangChain API. 

## Presenter
If the presenter is happy with the presentation, they can "Publish" the slides. This makes the slide deck un-editable.
Clicking "View slides" will then open the presenter view, where the presenter can send the link to attendees via copying the URL.
If the presenter has not published, no link will be available.

The presenter will be able to see what the attendees have submitted in the "Poll responses" section; the total responses in a barchart
for each question, and each individual's response in a selector.

## Attendee
The attendee is stored in the server with a given presentation ID; this Attendee ID is generated when the attendee name is submitted.
The attendee ID and Presentation ID can be seen in the URL.
When a poll response is clicked, that poll response is saved with a presentation ID, a slide ID and an attendee ID. 

When an attendee uses in the link, they are taken to a landing page where they can enter their name. Then, they can flip
through the slides and answer the poll questions. Going to the last slide will take them to a special "finish" slide, where they are
prompted to close the tab. 
Answering the poll questions and pressing submit will send the response to the API server; the submit button will be disabled, even
after page reload.
Re-loading the page will re-start the presentation from the first slide, but any submit buttons that were clicked will be grayed out.
If you don't respond to a question, it will say "No response" on the presenter side.


Bootstrap was used as the Front-end tool. Bootstrap API docs
https://getbootstrap.com/docs/5.3/getting-started/introduction/