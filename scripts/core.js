/*
    Codes to control the functionality of the website:
    + Getting input. 
    + API calls. 
    + Displaying responses. 
    Author: Long Tran
*/

// input-section
let input_section = document.getElementById("input-section");
let prompt_box = document.getElementById("input-box");
let creativity_slider = document.getElementById("creativity-slider");
let engines_list = document.getElementById("engines_list");
let send_button = document.getElementById("submit-button");
send_button.onclick = submitPrompt;
setUpEngineList()


// output-section
let response_list = document.getElementById("result-list");
let response_template = document.getElementById("result-card-template");
response_template.style.display = "none";

// classes
/*
    A class to manage each response UI.
*/
class ResponseManager {
    constructor(ui_obj) {
        this.obj = ui_obj
        let my_divs = this.obj.getElementsByTagName("div");
        let my_pres = this.obj.getElementsByTagName("pre");

        this.prompt = my_pres.namedItem("prompt");
        this.response = my_pres.namedItem("response");
        this.model_name = my_divs.namedItem("model_name");
        this.close_button = my_divs.namedItem("close_button");
        
        // set onclick action
        this.close_button.onclick = this.createRemoveSelfLambda();
        this.obj.style.display = "block";
    } // end constructor

    setPrompt(text) {
        this.prompt.innerHTML = text;
    } // end setPrompt

    setResponse(text) {
        this.response.innerHTML = text;
    } // end setResponse

    setModelName(model_name, result_type) {
        this.model_name.innerHTML = `Model: ${model_name}<br>A.I Operation Type: ${result_type}`;
    } // end setModelName

    createRemoveSelfLambda() {
        return () => {
            this.removeSelf()
        } // end lambda
    } // end removeSelf

    removeSelf() {
        if (this.obj != null) {
            this.obj.remove();
            this.obj = null;
        } // end if
    } // end removeSelf
} // end Response Manager

/*
    A class to manage the list of responses.
*/
class ResponseListManger {
    constructor(html_list, template) {
        this.list_ui = html_list;
        this.my_template = template;
        this.data_list = [];
    } // end constructor

    createResponseBlock(_prompt, response_data) {
        let my_data = {
            ref: null,
            prompt: _prompt,
            response: response_data['choices'][0]['text'],
            model_name: response_data['model'],
            result_type: response_data['object']
        };

        // push to block
        this.data_list.push(my_data);
        
        // create a response html block
        let response_ui = response_template.cloneNode(true);
        this.list_ui.insertBefore(response_ui, this.list_ui.firstChild);
        let response_manager = new ResponseManager(response_ui);

        my_data.ref = response_manager;

        response_manager.setPrompt(my_data.prompt);
        response_manager.setResponse(my_data.response);
        response_manager.setModelName(my_data.model_name, my_data.result_type);
    } // end createResponseBlock

    clearResponses() {
        this.data_list.forEach((data) => {
            data.ref.removeSelf();
        })
        this.data_list = []
    } // end clearRespones
} // end ResponseManager

// response list manager
let response_list_manager = new ResponseListManger(response_list, response_template);

// functions
/*
    Submit the prompt with the A.I configuration to the OpenAI API.
*/
function submitPrompt() {
    let text = prompt_box.value;
    let creativity = creativity_slider.value
    let temperature = creativity / 100.0;

    // prepare the data
    let data = {
        prompt: text,
        max_tokens: 50,
        temperature: temperature, // how creative
        top_p: 1.0,
    } // end data
    let OPENAI_SECRET = ""

    let request_param = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_SECRET}`,
        },
        body: JSON.stringify(data),
    };
       
    // send the data
    let selected_engine = engines_list.value;
    let promise = fetch(`https://api.openai.com/v1/engines/${selected_engine}/completions`, request_param)
    promise.then(response => response.text(), response => {
        console.error("Cannot access OpenAI");
        console.error("Reason: response");
    }).then(result => {
        let data = JSON.parse(result);
        //console.log(data)
        // push the result
        response_list_manager.createResponseBlock(text, data);
    });
} // end submitPrompt
    
function setUpEngineList() {
    let option_template = engines_list.getElementsByTagName("option")[0];
    option_template.style.display = "none";
    option_template.selected = ""
    
    let OPENAI_SECRET = ""

    let request_param = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_SECRET}`,
        } // end headers
    };
       
    // get engines list and set up the HTML select dropwdown
    let promise = fetch("https://api.openai.com/v1/engines", request_param);
    promise.then(response => response.text(), response => {
        console.error("Cannot access OpenAI");
        console.error("Reason: response")
    }).then(result => {
        let data = JSON.parse(result)['data'];
        data.forEach((value) => {
            if (value['owner'] == "openai") {
                let new_option = option_template.cloneNode(true);
                let id = value['id'];
                new_option.value = id;
                new_option.innerHTML = id;
                new_option.style.display = "block";
                engines_list.appendChild(new_option);

                if (id == "text-curie-001") {
                    new_option.selected = "selected";
                } // end if
            } // end if
        }) // end foreach
    }); // end then
} // end getEngineList

/*
    Clear all responses in the list. 
*/
function clearAllResponses() {
    response_list_manager.clearResponses();
} // end clearAllRespones
