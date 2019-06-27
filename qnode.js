function spawnElement(config) {
  let element = document.createElement(config["element"])
  config["classes"].forEach(function(class_name) {
    element.classList.add(class_name)
  })

  return element
}

class NodeElement {
  constructor(net, id, element) {
    this.id = id
    this.element = element
    this.net = net
    if(id in net.cache) {
      this.data = net.cache[id]["data"]
    } else {
      this.data = null
    }
    this.select = () => {
      this.net.selectNode(this.id)
    }
    this.toggleVisible = () => {
      this.net.toggleNodeVisible(this.id)
    }
  }
}

class QNet {
  constructor(mode) {
    const modes = ["sync", "switch", "select"]
    if(!(modes.includes(mode))) {
      console.log("Error: Invalid mode parameter '" + mode + "'")
    }
    this.fields = {}
    this.cache = {}
    this.ctrl = {}
    this.ents = {}
    this.active = null
    this.mode = mode

    this.onNodeAdd = {
      "*": function() {},
      "^": function() {}
    }
    this.onNodeDrop = {
      "*": function() {},
      "^": function() {}
    }
    this.reserved = {
      "node": ["*", "^"]
    }
  }
  // use element as field with config dict
  addField(element_id, config=null) {
    const default_conf = {
      "element": "div",
      "classes": []
    }
    if(config == null) {
      config = default_conf
    } else {
      // fill missing config keys with defaults
      for(let prop in default_conf) {
        if(!(prop in config)) {
          config[prop] = default_conf[prop]
        }
      }
    }
    if(!(element_id in this.fields)) {
      this.fields[element_id] = config
      this.onNodeAdd[element_id] = function() {}
      this.onNodeDrop[element_id] = function() {}
    }
  }
  // add node with optional data attribute
  addNode(node_id, data=null) {
    // check for no fields || duplicate nodeID
    if(this.fields.length == 0) {
      console.log("Error: no fields exist in QNet")
    } else if(node_id in this.cache) {
      console.log("Error: node '" + node_id + "' already exists")
    } else if(this.reserved["node"].includes(node_id)) {
      console.log("Error: '" + node_id + "' is a reserved word")
    } else {
      let cache_doc = {}
      cache_doc["data"] = data
      let fields = cache_doc["fields"] = {}

      let active_set = null
      if(this.mode in ["switch", "select"]) {
        if(this.active == null) {
          active_set = false
        } else {
          active_set = true
        }
      }
      // call pre-add handler
      let pre_node_element = new NodeElement(this, node_id, null)
      this.onNodeAdd["^"].bind(pre_node_element)()
      let node_elements = []
      for(let fid in this.fields) {
        // spawn each node using field config
        let config = this.fields[fid]
        let element = spawnElement(config)
        element.id = node_id + "#" + fid
        let container = document.getElementById(fid)
        container.appendChild(element)
        // add node_id to cache document
        fields[fid] = element.id
        console.log(fields)
        console.log(cache_doc)
        // if active node is set in switch mode:
        if(active_set == true && this.mode == "switch") {
          element.style.display = "none" // hide visibility
        }
        // if active node is not set in select mode:
        if(active_set == false && this.mode == "select") {
          this.onNodeSelect.bind(element)() // perform custom select function
        }
        // call add-node handler
        node_elements.push([element, fid])
      }
      // if active node is not set:
      if(active_set == false) {
        this.active = node_id // set node to active
      }
      // add cache document to cache
      this.cache[node_id] = cache_doc
      console.log(this.cache)
      // add ents entry for node
      this.ents[node_id] = []
      // call node add handlers
      for(let i = 0; i < node_elements.length; i += 1) {
        let element = node_elements[i][0]
        let fid = node_elements[i][1]
        let nel = new NodeElement(this, node_id, element)
        this.onNodeAdd["*"].bind(nel)()
        this.onNodeAdd[fid].bind(nel)()
      }
    }
  }
  // convert existing elements to node
  nodeFromIds(elem_ids, node_id) {
    let field_keys = Object.keys(this.fields)
    if(elem_ids.length != field_keys.length) {
      console.log("Error: failed to entangle elements (ids < fields)")
    } else if(node_id in this.cache) {
      console.log("Error: node with '" + node_id + "' already exists")
    } else if(this.reserved["node"].includes(node_id)) {
      console.log("Error: '" + node_id + "' is a reserved word")
    } else {
      let field_check = {}
      try {
        for(let i = 0; i < elem_ids.length; i += 1) {
          let element = document.getElementById(elem_ids[i])
          let parent_id = element.parentElement.id
          if(field_keys.includes(parent_id) && (!(parent_id in field_check))) {
            field_check[parent_id] = element.id
          } else {
            throw "Error: duplicate parent elements or non-field parent"
            return null
          }
        }
      } catch(e) {
        console.log(e)
        return null
      }
      // call pre-add handler
      let pre_node_element = new NodeElement(this, node_id, null)
      this.onNodeAdd["^"].bind(pre_node_element)()
      // for each field:
      this.cache[node_id] = {}
      let fields = this.cache[node_id]["fields"] = {}
      for(let fid in field_check) {
        fields[fid] = field_check[fid]
        // call add-node handler
        let element = document.getElementById(field_check[fid])
        let node_element = new NodeElement(this, node_id, element)
        this.onNodeAdd[fid].bind(node_element)()
      }
      if(this.mode == "switch") {
        // if new node IS NOT the only existing node:
        if(Object.keys(this.cache).length > 1) {
          // hide node visibility
          for(let fid in fields) {
            let element = document.getElementById(fields[fid])
            element.style.display = "none"
          }
        } else {
          this.active = node_id
        }
      } else if(this.mode == "select") {
        // if new node IS the only existing node:
        if(Object.keys(this.cache).length == 1) {
          for(let fid in fields) {
            let element = document.getElementById(fields[fid])
            this.onNodeSelect.bind(element)()
          }
        }
      }
    }
  }
  // drop node
  dropNode(node_id) {
    if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      // call pre-drop handler
      let pre_node_element = new NodeElement(this, node_id, null)
      this.onNodeDrop["^"].bind(pre_node_element)()
      // for each field:
      let fields = this.cache[node_id]["fields"]
      for(let fid in fields) {
        // call drop-node handler
        let element = document.getElementById(fields[fid])
        let node_element = new NodeElement(this, node_id, element)
        this.onNodeDrop["*"].bind(node_element)()
        this.onNodeDrop[fid].bind(node_element)()
        // remove node instance from document
        element.remove()
      }
      // remove entangled elements
      for(let i = 0; i < this.ents[node_id].length; i += 1) {
        document.getElementById(this.ents[node_id][i]).remove()
      }
      // remove node from cache + ents
      delete this.cache[node_id]
      delete this.ents[node_id]

      // check for active node in switch mode
      if(this.mode == "switch" && this.active == node_id) {
        let next_id = null
        for(let key in this.cache) {
          next_id = key
          break
        }
        if(next_id != null) {
          for(let fid in this.cache[next_id]["fields"]) {
            let element = document.getElementById(this.cache[next_id]["fields"][fid])
            element.style.display = null
          }
          this.active = next_id
        } else {
          this.active = null
        }
      } else if(this.mode == "select" && this.active == node_id) {
        let next_id = null
        for(let key in this.cache) {
          next_id = key
          break
        }
        if(next_id != null) {
          this.active = null
          for(let fid in this.cache[next_id]["fields"]) {
            this.selectNode(next_id)
          }
        } else {
          this.active = null
        }
      }
    }
  }
  // toggle visibility for node
  toggleNodeVisible(node_id) {
    if(this.mode != "sync") {
      console.log("Error: cannot toggle view using mode '" + this.mode + "'")
    } else if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      let fields = this.cache[node_id]["fields"]
      for(let fid in fields) {
        let element = document.getElementById(fields[fid])
        if(element.style.display == "none") {
          element.style.display = null
        } else {
          element.style.display = "none"
        }
      }
    }
  }
  // return node element at field
  nodeAt(node_id, field_id) {
    if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      let elid = this.cache[node_id]["fields"][field_id]
      return document.getElementById(elid)
    }
  }
  // switch to node
  switchTo(node_id) {
    if(this.mode != "switch") {
      console.log("Error: cannot switch to active node using mode '"+this.mode+"'")
    } else if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      // set current active node to invisible
      let fields = this.cache[this.active]["fields"]
      for(let fid in fields) {
        let element = document.getElementById(fields[fid])
        element.style.display = "none"
      }
      // set new active node to default visibility
      fields = this.cache[node_id]["fields"]
      for(let fid in fields) {
        let element = document.getElementById(fields[fid])
        element.style.display = null
      }
      // register new active element
      this.active = node_id
      // check for bound switch, call switchClick handler
      for(let eid in this.ctrl) {
        if(this.ctrl[eid] == node_id) {
          let element = document.getElementById(eid)
          this.onSwitchClick.bind(element)()
        }
      }
    }
  }
  selectNode(node_id) {
    if(this.mode != "select") {
      console.log("Error: cannot select active node using mode '" + this.mode + "'")
    } else if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      // perform custom unselect function on currently active node
      if(this.active != null) {
        let fields = this.cache[this.active]["fields"]
        for(let fid in fields) {
          let element = document.getElementById(fields[fid])
          this.onNodeUnselect.bind(element)()
        }
      }
      // perform custom select function on newly active node
      let fields = this.cache[node_id]["fields"]
      for(let fid in fields) {
        let element = document.getElementById(fields[fid])
        this.onNodeSelect.bind(element)()
      }
      this.active = node_id
      // check for bound select, call selectClick handler
      for(let eid in this.ctrl) {
        if(this.ctrl[eid] == node_id) {
          let element = document.getElementById(eid)
          this.onSelectClick.bind(element)()
        }
      }
    }
  }
  // handles bound actions
  handleEvent(evt) {
    let tid = evt.target.id
    let node_id = this.ctrl[tid]

    if(this.mode == "switch") {
      this.switchTo(node_id)
    } else if(this.mode == "select") {
      this.selectNode(node_id)
    }
  }
  // bind switchTo(node_id) to element_id
  bindSwitch(element_id, node_id) {
    if(this.mode != "switch") { // check
      console.log("Error: cannot use bound switch methods using mode '" + this.mode + "'")
    } else if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else if(element_id in this.ctrl) {
      console.log("Error: element with ID '" + element_id + "' already bound")
    } else {
      let element = document.getElementById(element_id)
      element.addEventListener("click", this, false)

      this.ctrl[element_id] = node_id
    }
  }
  // unbind switchTo from element_id
  unbindSwitch(element_id) {
    if(this.mode != "switch") { // check
      console.log("Error: cannot use bound switch methods using mode '" + this.mode + "'")
    } else if(!(element_id in this.ctrl)) {
      console.log("Error: element with ID '"+element_id+"' is not bound")
    } else {
      document.getElementById(element_id).removeEventListener("click", this)
      delete this.ctrl[element_id]
    }
  }
  // bind selectNode to element_id
  bindSelect(element_id, node_id) {
    if(this.mode != "select") {
      console.log("Error: cannot use bound select methods using mode '"+this.mode+"'")
    } else {
      let element = document.getElementById(element_id)
      element.addEventListener("click", this, false)

      this.ctrl[element_id] = node_id
    }
  }
  // unbind switchTo from element_id
  unbindSelect(element_id, node_id) {
    if(this.mode != "select") { // check
      console.log("Error: cannot use bound select methods using mode '"+this.mode+"'")
    } else if(!(element_id in this.ctrl)) {
      console.log("Error: element with ID '"+element_id+"' is not bound")
    } else {
      document.getElementById(element_id).removeEventListener("click", this)
      delete this.ctrl[element_id]
    }
  }
  // entangle element to node: will remove element on dropNode
  nodeEntangle(node_id, element_id) {
    if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else {
      this.ents[node_id].push(element_id)
    }
  }
  nodeUnentangle(node_id, element_id) {
    if(!(node_id in this.cache)) {
      console.log("Error: node '" + node_id + "' does not exist")
    } else if(!(element_id in this.ents[node_id])){
      console.log("Error: element not entangled to node '" + node_id + "'")
    } else {
      let index = this.ents[node_id].indexOf(element_id)
      this.ents[node_id].splice(index, 1)
    }
  }
  // custom bound switch listener
  onSwitchClick() {} // this = clicked element
  // custom bound select listener
  onSelectClick() {}
  // custom node selected listener
  onNodeSelect() {} // this = selected node element
  // custom node unselected listener
  onNodeUnselect() {} // this = unselected node element

}
