# Readme

# AI Usage
ChatGPT was used as the primary AI for this assignment; it was used in coding the functions and planning out the program structure.
AI was especially useful in quickly creating the skeleton JSX format with natural language rather than directly coding it.
It was helpful with writing the API calls, and No API keys were pasted into the AI.
Finally, AI was used for the AI Slide generator and the Slide previewer sections.
Github Copilot's inline fill was used to autofill tedious code and commenting.

# Testing Guide
## Opening the site
Run 'npm run start' to open the website on Localhost; the front-end JSX can run without the server, but 
it will not be able to convert the markdown format to JSX, and AI slide creation will not work.

Click 'Create a presentation' to create a presentation. Fill in the details.
Edit the newly-created presentation by clicking on 'Edit presentation.'

## Markdown Editor
Inside the Edit Slides page, there is a slide previewer a markdown editor and some debug formats.
To use the markdown previewer, if the server is running, after typing the desired markdown into the edit box,
it can be directly converted into a slide format (the intermediate steps are in the debug format dropdowns) by
pressing the convert to markdown button.

The format is like assignment 1; Namely, triple hyphens are slide separators.
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

## Presenter
If the presenter is happy with the presentation, they can "Publish" the slides. This makes the slide deck un-editable.
Clicking "View slides" will then open the presenter view, where the presenter can send the link to attendees via copying the URL.
If the presenter has not published, no link will be available.

The presenter will be able to see what the attendees have submitted in the "Poll responses" section; the total responses in a barchart
for each question, and each individual's response in a selector.

## Attendee
When an attendee pastes in the link, they are taken to a landing page where they can enter their name. Then, they can flip
through the slides and answer the poll questions. Going to the last slide will take them to a special "finish" slide, where they are
prompted to close the tab. 
Answering the poll questions and pressing submit will send the response to the API server; the submit button will be disabled, even
after page reload.
Re-loading the page will re-start the presentation from the first slide, but any submit buttons that were clicked will be grayed out.
If you don't respond to a question, it will say "No response" on the presenter side.