class Start extends Scene {
    create() {
        // Set the title of the story using the story data
        this.engine.setTitle(this.engine.storyData.Title);
        this.engine.addChoice("Begin the story");
    }

    handleChoice() {
        // Initialize the player's inventory
        this.engine.inventory = [];
        // Navigate to the initial location of the story
        this.engine.gotoScene(Location, this.engine.storyData.InitialLocation);
    }
}

class Location extends Scene {
    create(key) {
        this.locationKey = key;
        // Use `key` to get the data object for the current story location
        let locationData = this.engine.storyData.Locations[key];
        
        // Display the Body of the location data
        this.engine.show(locationData.Body);
        
        // Check if there are any items to pick up at this location
        if (locationData.Item) {
            let item = locationData.Item;
            if (!this.engine.inventory.includes(item.Name)) {
                this.engine.addChoice(`Pick up ${item.Name}`, { action: "pickupItem", item: item });
            }
        }
        
        // Check if the location has any Choices
        if (locationData.Choices && locationData.Choices.length > 0) {
            // Loop over the location's Choices
            for (let choice of locationData.Choices) {
                // Check if the choice requires an item
                if (choice.RequiresItem) {
                    // Only show the choice if the player has the required item
                    if (this.engine.inventory.includes(choice.RequiresItem)) {
                        this.engine.addChoice(choice.Text, choice);
                    }
                } else {
                    // Add the choice text and target to the choices list
                    this.engine.addChoice(choice.Text, choice);
                }
            }
        } else {
            this.engine.addChoice("The end.");
        }
    }

    handleChoice(choice) {
        if (choice) {
            if (choice.action === "pickupItem") {
                // Add the item to inventory
                this.engine.inventory.push(choice.item.Name);
                // Display message
                this.engine.show(`&gt; You picked up ${choice.item.Name}`);
                // If the item has effects on the player, apply them
                if (choice.item.Effect) {
                    this.engine.show(choice.item.Effect);
                }
                // Refresh the location to update available choices
                this.engine.gotoScene(Location, this.locationKey);
            } else {
                // Display the selected choice text
                this.engine.show("&gt; " + choice.Text);
                
                // Check if this choice uses an item
                if (choice.UsesItem) {
                    // Remove the item from inventory if it's consumed
                    if (choice.ConsumeItem) {
                        const index = this.engine.inventory.indexOf(choice.UsesItem);
                        if (index > -1) {
                            this.engine.inventory.splice(index, 1);
                        }
                    }
                    // Display the effect of using the item
                    if (choice.ItemEffect) {
                        this.engine.show(choice.ItemEffect);
                    }
                }
                
                // Navigate to the target location
                if (choice.Target) {
                    // If this location has a specific scene class, use it
                    const locationData = this.engine.storyData.Locations[choice.Target];
                    if (locationData && locationData.SceneType === "Radio") {
                        this.engine.gotoScene(RadioRoom, choice.Target);
                    } else if (locationData && locationData.SceneType === "DarkRoom") {
                        this.engine.gotoScene(DarkRoom, choice.Target);
                    } else {
                        this.engine.gotoScene(Location, choice.Target);
                    }
                }
            }
        } else {
            // Navigate to the end scene
            this.engine.gotoScene(End);
        }
    }
}

// Special location with a radio that can be interacted with
class RadioRoom extends Location {
    create(key) {
        super.create(key);
        // Additional radio-specific options
        if (!this.radioOn) {
            this.engine.addChoice("Turn on the radio", { action: "turnRadioOn" });
        } else {
            this.engine.addChoice("Turn off the radio", { action: "turnRadioOff" });
            this.engine.addChoice("Change radio station", { action: "changeStation" });
        }
    }
    
    handleChoice(choice) {
        if (choice.action === "turnRadioOn") {
            this.radioOn = true;
            this.currentStation = 0;
            this.engine.show("&gt; You turn on the radio");
            this.engine.show(this.engine.storyData.Locations[this.locationKey].RadioMessages[this.currentStation]);
            this.engine.gotoScene(RadioRoom, this.locationKey);
        } else if (choice.action === "turnRadioOff") {
            this.radioOn = false;
            this.engine.show("&gt; You turn off the radio");
            this.engine.gotoScene(RadioRoom, this.locationKey);
        } else if (choice.action === "changeStation") {
            this.currentStation = (this.currentStation + 1) % this.engine.storyData.Locations[this.locationKey].RadioMessages.length;
            this.engine.show("&gt; You change the radio station");
            this.engine.show(this.engine.storyData.Locations[this.locationKey].RadioMessages[this.currentStation]);
            this.engine.gotoScene(RadioRoom, this.locationKey);
        } else {
            super.handleChoice(choice);
        }
    }
}

// Special location that requires a light source
class DarkRoom extends Location {
    create(key) {
        this.locationKey = key;
        let locationData = this.engine.storyData.Locations[key];

        // Check if the player has a flashlight
        if (this.engine.inventory.includes("Flashlight")) {
            // Player can see in the dark
            this.engine.show(locationData.Body);

            // Show regular choices
            if (locationData.Choices && locationData.Choices.length > 0) {
                for (let choice of locationData.Choices) {
                    if (choice.RequiresItem) {
                        if (this.engine.inventory.includes(choice.RequiresItem)) {
                            this.engine.addChoice(choice.Text, choice);
                        }
                    } else {
                        this.engine.addChoice(choice.Text, choice);
                    }
                }
            }
        } else {
            // Player can't see in the dark
            this.engine.show(locationData.DarkDescription || "It's too dark to see anything.");
            this.engine.show(locationData.DarkExitText || "You decide to leave.");
            this.engine.addChoice("Leaves Mansion", { Target: locationData.DarkExit || "Front Door" });
        }
    }
}

class End extends Scene {
    create() {
        // Display a horizontal rule and the story credits
        this.engine.show("<hr>");
        this.engine.show(this.engine.storyData.Credits);
        
        // Add a replay option
        this.engine.addChoice("Play Again");
    }
    
    handleChoice() {
        // Reset and restart the game
        this.engine.output.innerHTML = '';
        this.engine.gotoScene(Start);
    }
}

// Load the story starting from the Start scene
Engine.load(Start, 'myStory.json');