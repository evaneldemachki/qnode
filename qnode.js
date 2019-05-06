function spawnElement(content, config) {
  let element = document.createElement(config["element"])
  config["class"].forEach(function(class_name) {
    element.classList.add(class_name)
  })
  element.innerHTML = content
  return element
}

class QNet {
  constructor(name) {
    this.name = name
    this.fields = {}
    this.cache = {}
    this.ctrl = {}
    this.active = null
    this.mode = "default"
  }
  addField(name, container_id, config) {
    if(!(name in this.fields)) {
      this.fields[name] = {}
      this.fields[name]["config"] = config
      this.fields[name]["id"] = container_id
    }
  }
  setMode(mode) {
    if(mode == "default") {
      if(this.mode != "default") {
        // set all nodes to default visibility
        for(let key in this.cache) {
          this.cache[key].forEach(function(node_id) {
            let element = document.getElementById(node_id)
            element.style.display = null
          })
        }
        this.active = null
        this.mode = "default"
        for(let key in this.ctrl) {
          let element = document.getElementById(key)
          element.removeEventListener("click", this)
        }
        this.ctrl = {}
      }
    } else if(mode == "sync") {
        // hide all nodes
        for(let key in this.cache) {
          this.cache[key].forEach(function(node_id) {
            let element = document.getElementById(node_id)
            element.style.display = "none"
          })
        }
        // set first node to default visibility
        let name = null
        for(let key in this.cache) {
          this.cache[key].forEach(function(node_id) {
            let element = document.getElementById(node_id)
            element.style.display = null
          })
          name = key
          break
        }
        this.active = name
        this.mode = "sync"
    } else {
      console.log("Error: invalid mode '"+mode+"'")
    }
  }
  addNode(name, content) {
    // check for no fields || duplicate node name
    if(this.fields.length == 0) {
      console.log("Error: no fields exist in QNet '"+this.name+"'")
    } else if(name in this.cache) {
      console.log("Error: node with name '"+name+"' already exists in QNet '"+this.name+"'")
    } else {
      let cache_row = []
      let active = null
      if(this.mode == "sync") {
        if(this.active == null) {
          active = false
        } else {
          active = true
        }
      }
      for(let fn in this.fields) {
        // spawn each node using field config
        let config = this.fields[fn]["config"]
        let cid = this.fields[fn]["id"]
        let element = spawnElement(content, config)
        element.id = name + "#" + fn
        // add each node to field container
        let container = document.getElementById(cid)
        if(active == true) {
          element.style.display = "none"
        }
        container.appendChild(element)
        // add node_id to cache_row
        cache_row.push(element.id)
      }
      if(active == false) {
        this.active = name
      }
      // add cache_row to cache
      this.cache[name] = cache_row
    }
  }
  dropNode(name) {
    // check for non-existent node
    if(!(name in this.cache)) {
      console.log("Error: node '"+name+"' does not exist")
    } else {
      // remove each node instance from document
      this.cache[name].forEach(function(node_id) {
        document.getElementById(node_id).remove()
      })
      // remove node from cache
      delete this.cache[name]
      // check for active node in sync mode
      if(this.mode == "sync") {
        if(this.active == name) {
          let next_id = null
          for(let key in this.cache) {
            next_id = key
            break
          }
          if(next_id != null) {
            this.cache[next_id].forEach(function(node_id) {
              let element = document.getElementById(node_id)
              element.style.display = null
            })
            this.active = next_id
          } else {
            this.active = null
          }
        }
      }
    }
  }
  toggleNodeView(name) {
    // check for non-existent node
    if(!(name in this.cache)) {
      console.log("Error: node '"+name+"' does not exist")
    } else if(this.mode != "default") {
      console.log("Error: cannot toggle view using mode '"+this.mode+"'")
    } else {
      this.cache[name].forEach(function(node_id) {
        let element = document.getElementById(node_id)
        if(element.style.display == "none") {
          element.style.display = null
        } else {
          element.style.display = "none"
        }
      })
    }
  }
  setActiveNode(name) {
    if(!(name in this.cache)) {
      console.log("Error: node '"+name+"' does not exist")
    } else if(this.mode != "sync") {
      console.log("Error: cannot set active node using mode '"+this.mode+"'")
    } else {
      // set current active node to invisible
      this.cache[this.active].forEach(function(node_id) {
        let element = document.getElementById(node_id)
        element.style.display = "none"
      })
      // set new active node to default visibility
      this.cache[name].forEach(function(node_id) {
        let element = document.getElementById(node_id)
        element.style.display = null
      })
      this.active = name
    }
  }
  handleEvent(evt) {
    let node_id = this.ctrl[evt.target.id]
    this.setActiveNode(node_id)
  }
  addController(name, element_id) {
    if(!(name in this.cache)) {
      console.log("Error: node '"+name+"' does not exist")
    } else if(this.mode != "sync") {
      console.log("Error: cannot add node controller using mode '"+this.mode+"'")
    } else if(element_id in this.ctrl) {
      console.log("Error: element with ID '"+element_id+"' is already a controller")
    } else {
      let element = document.getElementById(element_id)
      element.addEventListener("click", this, false)
      this.ctrl[element_id] = name
    }
  }
  dropController(element_id) {
    if(!(element_id in this.ctrl)) {
      console.log("Error: element with ID '"+element_id+"' is not a controller")
    } else {
      document.getElementById(element_id).removeEventListener("click", this)
      delete this.ctrl[element_id]
    }
  }
}
