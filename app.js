//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

mongoose.set('useFindAndModify', false); //To overcome deprication warning.

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://obaid-admin:Test123@cluster0.yyv9j.mongodb.net/todolistDB?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true});

// Schema
const itemsSchema = {
  name: String
};
// Model
const Item = mongoose.model("Item", itemsSchema);

// default items

const item1 = new Item({
  name: "Welcome to your todo list."
});
const item2 = new Item({
  name: "Hit the + buttton to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

// schema for custom routes

const listSchema ={
  name: String,
  items: [itemsSchema]
};

// Model for customlist
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find({}, function(err, foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Default items added sucessfully.")
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
  

});

// custom route

app.get("/:customListName", function(req, res){
  const customListName= _.capitalize(req.params.customListName);
  

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      } else{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
});


app.get("/undefined", function(req, res){
  res.redirect("/");
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
  

});

app.post("/delete", function(req, res){
  const checkedItemId= req.body.checkbox;
  const listName = req.body.listName;
  /* To use findByIDAndRemove the callback function is MUST. If the callback function is not mentioned then
  findByIdAndRemove will simply query the items and then return. to execute "AndRemove" part in the method the 
  callback function is MUSTT!!  */

  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err){
        console.log(err);
      } else{
        console.log("Successfully deleted the checked item.");
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull :{items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+foundList.name)
      }
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function() {
  console.log("Server started sucessfully.");
});
