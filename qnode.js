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
  addField(container_id, config) {
    if(!(container_id in this.fields)) {
      this.fields[container_id] = config
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
        let config = this.fields[fn]
        let element = spawnElement(content, config)
        element.id = name + "#" + fn
        // add each node to field container
        let container = document.getElementById(fn)
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
  entangleIds(name, id_array) {
    console.log("name: "+name)
    let field_keys = Object.keys(this.fields)
    if(id_array.length != field_keys.length) {
      console.log("Error: failed to entangle elements (ids < fields)")
    } else if(name in this.cache) {
      console.log("Error: node with name '"+name+"' already exists in QNet '"+this.name+"'")
    } else {
      let field_check = {}
      let stop_flag = false
      id_array.forEach(function(element_id) {
        if(stop_flag == true) {
          return null
        }
        let element = document.getElementById(element_id)
        let parent_id = element.parentElement.id
        if(field_keys.includes(parent_id) && (!(parent_id in field_check))) {
          field_check[parent_id] = element.id
        } else {
          console.log("Error: duplicate parent elements or non-field parent")
          stop_flag = true
          return null
        }
      })
      this.cache[name] = []
      for(let fn in field_check) {
        this.cache[name].push(field_check[fn])
      }
      if(this.mode == "sync") {
        if(Object.keys(this.cache).length > 1) {
          this.cache[name].forEach(function(element_id) {
            let element = document.getElementById(element_id)
            element.style.display = "none"
          })
        } else {
          this.active = name
        }
      }
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
      console.log(this.active)
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
    let tid = evt.target.id
    let element = document.getElementById(tid)
    this.onControlClick.bind(element)()
    let node_id = this.ctrl[tid]
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
    if(this.mode != "sync") {
      console.log("Error: failed to drop controller using mode '"+this.mode+"'")
    } else if(!(element_id in this.ctrl)) {
      console.log("Error: element with ID '"+element_id+"' is not a controller")
    } else {
      document.getElementById(element_id).removeEventListener("click", this)
      delete this.ctrl[element_id]
    }
  }
  onControlClick() {}
}
