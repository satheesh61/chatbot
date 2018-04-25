"use strict";

var builder = require("botbuilder");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var restify = require('restify');

var fs = require('fs');

//Creating the REST Server
var server = restify.createServer();

//Enabling the Server to listen
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


//Connecting the chatConnector ( Emulator )
var connector = new builder.ChatConnector({
  //  appId: 'a39d39b7-48d0-4674-9a90-01f0e7c35403',
   // appPassword: 'vJBcqKAdmZhYdh7U8W9O7he'
    appId: '',
    appPassword: ''
});

server.post('/api/messages', connector.listen());

//Creation of the Universal Bot and providing its location where it should communicate
var bot = new builder.UniversalBot(connector);

//This recognizer is for TCE Faq
var recognizerForTceFaq = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '6d817235-de60-4e90-9e82-1c433bbf874d' , 
    subscriptionKey: ' 64a5d90dafc44f2a9da2353e6f204e2d',
    top : 5
     
});

//This rercognizer is for Stf Faq
var recognizerForStfFaq = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '5269b837-8d14-4308-a4f8-7868dea8bca8',
    subscriptionKey: ' 64a5d90dafc44f2a9da2353e6f204e2d',
    top: 3

});

//This qnamkertools is the one which is enabling us to provide the 'Did you mean card', if the bot is not sure with the answer
var qnaMakertTools = new builder_cognitiveservices.QnAMakerTools();
bot.library(qnaMakertTools.createLibrary());

//This is the Dialog varaible which will hold the property of the particular qna (Tce)
var basicTceQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizerForTceFaq],
                defaultMessage: 'sorry coudnt find answers to your qns..type  "HELP"  if you need assistance',
                qnaThreshold: 0.3, //can be increased or decreased
                feedbackLib: qnaMakertTools
});

//This is the Dialog varaible which will hold the property of the particular qna (Stf)
var basicStfQnaMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers:  [recognizerForStfFaq],
                defaultMessage: 'Sorry i cant find in Stf, type  "HELP" If you need assistance',
                qnaThreshold: 0.3,
                feedbackLib: qnaMakertTools
});

//Check is used to ensure that the bot asks th user for name only once thoughout the session
var check = 0;

/*domainSelected is the one which is responsible for calling  the different qnamakers,
* if this variable is set to 0, it indicates that the domain is yet to be chosen
* if it is 1, it indicates that the neet has been chosen
* if it is 2, it indicates that the Gst has been chosen
*/
var domainSelected = 0;

/*This is where the Dialog stack is implemented.
* '/' is the root dialog which is the first dialog that gets pushed to the stack
* It follows waterfall model.
*/
 bot.dialog('/', [ 
    function(session,args,next) {
        if(check) {
            if(domainSelected == 1) {
                session.replaceDialog('Stf');
            }
            else if (domainSelected == 2) {
                session.replaceDialog('Tce');
            }
            else if(domainSelected == 3){
                session.replaceDialog('summary');
            }
        }
        else {
             next(); 
        }
    },
    function(session,next) {
        check = 1;
        builder.Prompts.text(session,"hello!,  what is your name?");
    },

    function(session,results) {
        session.userData.id = results.response;
        session.send("hello %s!!  ",session.userData.id);

        // Card Creation 
        const card = new builder.ThumbnailCard(session);
        card.buttons([
            new builder.CardAction(session).title('Ask a question').value('I would like to ask a question').type('imBack'),
            new builder.CardAction(session).title('End Conversation').value('bye').type('imBack'),
        ]).text('What would you like to do?');
        
        const message = new builder.Message(session);
        message.addAttachment(card);
        //domainSelected = 1;
        session.endConversation(message);
    }
 ]);

//These are the bot dialog declaration and it can defined too if required.
bot.dialog('Tce',basicTceQnAMakerDialog);

bot.dialog('Stf', basicStfQnaMakerDialog);

bot.dialog('summary',function(session){
    var title = "SUMMARY OF THE PARAGRAPH\n";
    var msg = session.message;
    if (msg.attachments && msg.attachments.length > 0) {
     // Echo back attachment
     var attachment = msg.attachments[0];
     var obj = msg.attachments[0].content;
       var content = fs.readFileSync(attachment.name, 'utf-8');  
    session.send(content);
     
     
           
        
    } else {
        
        session.send("send an attachment to process");
    }
  

});


//when the user types help, this is triggered 
bot.dialog('help', function (session, args, next) {
     
   session.send("%s , Iam a bot and i can answer your questions on TCE.   If you want to change the domain Type  'CHANGE DOMAIN' If you want to end conversation Type   'BYE'  ", session.userData.id);
   session.endDialog();
})
.triggerAction({
    matches: /^help$/i,
    onSelectAction: (session, args, next) => {
        session.beginDialog(args.action, args);
    }
});


//This is the domain dialog and it displays the domains through cards
bot.dialog('Domains',  function(session){
        const cards = new builder.ThumbnailCard(session);

        cards.buttons([
            new builder.CardAction(session).title('Staff Info').value('Stf').type('imBack'),
            new builder.CardAction(session).title('Tce Info').value('Tce').type('imBack'),
            new builder.CardAction(session).title('summarise').value('summarise').type('imBack'),
            
        ]).text('Choose any one Domain and feel free to type "help" if u need assistance at any point of time');
        
        const message = new builder.Message(session);
        message.addAttachment(cards);
        session.endConversation(message);

}).triggerAction({
    matches: /^Change domain$/i,
    onSelectAction: (session, args, next) => { 
        session.beginDialog(args.action, args);
    }
});;


bot.dialog('Stf dialog', function(session, args, next){
    domainSelected = 1; // confirming that the staff has been selected.
    session.endDialog('You have chosen Staff %s, Yes post your queries', session.userData.id);
}).triggerAction({
    matches: /^Stf$/i,
    onSelectAction: (session, args, next) => { 
        session.beginDialog(args.action, args);
    }
});

bot.dialog('Tce dialog', function(session, args, next){
    domainSelected = 2; // confirming that the Tce has been selected.
    session.endDialog('You have chosen Tce %s, Yes post your queries', session.userData.id);
    
}).triggerAction({
    matches: /^Tce$/i,
    onSelectAction: (session, args, next) => { 
        session.beginDialog(args.action, args);
    }
});
bot.dialog('summary dialog', function(session, args, next){
    domainSelected = 3; // confirming that the Gst has been selected.
    session.endDialog('send yout attachment %s, to process', session.userData.id);
    
}).triggerAction({
    matches: /^summarise$/i,
    onSelectAction: (session, args, next) => { 
        session.beginDialog(args.action, args);
    }
});


bot.dialog('Ask quesion dialog', function(session, args, next){
    domainSelected = 0;
    session.send('You can ask me and I can help in the following Sections!');
    session.endDialog();
    session.beginDialog('Domains'); // This is where the domain dialog is called !!
}).triggerAction({
    matches: /^I would like to ask a question$/i,
    onSelectAction: (session, args, next) => {
        session.beginDialog(args.action, args);
    }
});

//when the user chooses the END CONVERSATION within the cards, this gets triggered
bot.dialog('end', function (session, args, next) {
check = 0;
   session.endDialog(" bye %s, Session is closed! ",session.userData.id);
  
})
.triggerAction({
    matches: /^bye$/i,
    onSelectAction: (session, args, next) => {
       
        session.beginDialog(args.action, args);
    }
});

