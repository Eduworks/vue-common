<template>
    <li
        v-if="expandedThing"
        :class="['e-Property e-' + shortType, editingThingClass, { 'has-value': expandedValue}]">
        <!-- label -->
        <label
            :title="comment">
            <i
                v-if="comment"
                :title="comment"
                class="fa fa-info-circle"
                aria-hidden="true" />
            <span class="thing-label">
                {{ displayLabel }}
            </span>
        </label>
        <!-- property has values -->
        <ul
            class="e-Property-ul"
            v-if="expandedValue && show">
            <slot
                name="copyURL"
                :expandedProperty="expandedProperty"
                :expandedThing="expandedThing" />
            <li
                v-for="(item,index) in expandedValue"
                :key="index"
                class="property-value"
                @[clickHandler].stop="startEditing">
                <Thing
                    v-if="!edit && isLink(item) && expandedProperty != '@id' && expandedProperty != 'registryURL'"
                    :uri="item['@id'] || item['@value']"
                    clickToLoad="true"
                    :parentNotEditable="!canEdit"
                    :profile="childProfile"
                    class="related-competency"
                    @deleteObject="deleteObject" />
                <Thing
                    :expandedObj="item"
                    v-else-if="!isText(item)"
                    :parentNotEditable="!canEdit"
                    :profile="childProfile"
                    @deleteObject="deleteObject" />
                <span v-else-if="isLink(item) && profile && profile[expandedProperty] && (profile[expandedProperty]['noTextEditing'] === 'true' || profile[expandedProperty]['readOnly'] === 'true')">
                    {{ item['@id'] || item['@value'] }}
                </span>
                <span v-else-if="edit && typeof(item) === 'String' && profile && profile[expandedProperty] && (profile[expandedProperty]['noTextEditing'] === 'true' || profile[expandedProperty]['readOnly'] === 'true')">
                    {{ item }}
                </span>
                <span v-else-if="edit && profile && profile[expandedProperty] && (profile[expandedProperty]['noTextEditing'] === 'true' || profile[expandedProperty]['readOnly'] === 'true')">
                    {{ item["@value"] }}
                </span>
                <!-- property string input -->
                <span
                    v-else-if="edit"
                    class="property-string-span">
                    <PropertyString
                        :index="index"
                        :expandedProperty="expandedProperty"
                        :expandedThing="expandedThing"
                        :expandedValue="item"
                        :profile="childProfile"
                        :langString="langString"
                        :range="range"
                        :options="(profile && profile[expandedProperty] && profile[expandedProperty]['options']) ? profile[expandedProperty]['options'] : null" />
                </span>
                <span
                    class="e-Property-text"
                    v-else-if="isObject(expandedValue[index]) && expandedValue[index]['@language']">
                    {{ expandedValue[index]["@language"] + ": " + expandedValue[index]["@value"] }}
                </span>
                <span
                    class="e-Property-text"
                    v-else-if="isObject(expandedValue[index])">
                    {{ expandedValue[index]["@value"] }}
                </span>
                <span
                    class="e-Property-text"
                    v-else>
                    {{ expandedValue[index] }}
                </span>
                <div class="editing-property-buttons">
                    <span
                        v-if="edit"
                        @click.stop="showModal('remove', index)"
                        class="button is-text has-text-dark">
                        <span class="icon">
                            <i
                                class="fa fa-trash has-text-danger"
                                aria-hidden="true" />
                        </span>
                    </span>
                </div>
            </li>
            <ul v-if="unsaved && show && unsaved.length>0">
                <li
                    v-for="(item, index) in unsaved"
                    :key="index">
                    <span
                        v-if="edit == true"
                        class="input-span">
                        <input v-model="unsaved[index]">
                    </span>
                    <span v-else>
                        {{ item }}
                    </span>
                    <div class="editing-property-buttons">
                        <span
                            class="button is-text"
                            v-if="edit == true"
                            @click.stop="showModal('remove unsaved', index)">
                            <span class="icon remove is-small">
                                <i
                                    class="fa fa-trash has-text-danger"
                                    aria-hidden="true" />
                            </span>
                        </span>
                    </div>
                </li>
            </ul>
            <!-- save buttons-->
            <li class="add-property-button">
                <span
                    v-if="canEdit && edit"
                    @click.stop="stopEditing"
                    class="button is-primary is-small save-property">
                    <span
                        class="icon save is-small"
                        title="Save">
                        <i
                            class="fa has-text-white fa-save"
                            aria-hidden="true" />
                    </span>
                    <span class="button-text">
                        save
                    </span>
                </span>
                <!-- add for no range -->
                <span
                    v-if="canEdit && range.length == 0 && canAdd && addOrSearch !== 'search'"
                    @click.stop="add('string')"
                    class="button is-pulled-right is-small is-text has-text-info add-property">
                    <span
                        class="icon"
                        :title="'Add New ' + displayLabel">
                        <i
                            class="fa has-text-info fa-plus"
                            aria-hidden="true" />
                    </span>
                    <span class="button-text">
                        Add
                    </span>
                </span>
                <!-- add for range exits -->
                <span
                    v-for="(targetType) in range"
                    :key="targetType"
                    v-else-if="canEdit && canAdd && addOrSearch !== 'search'"
                    class="button is-small is-text has-text-info "
                    :title="'Add New '+ displayLabel"
                    @click.stop="add(targetType); startEditing();">
                    <span class="icon add-new">
                        <i
                            class="fa has-text-info fa-plus"
                            aria-hidden="true" />
                    </span>
                    <span class="button-text">
                        Add {{ displayLabel }}
                    </span>
                </span>
                <span
                    v-if="profile && profile[expandedProperty] && profile[expandedProperty]['iframePath'] && canAdd && addOrSearch !== 'add'"
                    title="Search"
                    @click.stop="add('search')"
                    class="button is-small is-text has-text-info">
                    <span class="icon is-white">
                        <i class="fa fa-search has-text-info" />
                    </span>
                    <span>Search</span>
                </span>
            </li>
        </ul>
        <ul
            v-else
            class="e-Property-ul">
            <li class="property-value">
                No value
                <div
                    class="add-property-button"
                    v-if="canEdit">
                    <button
                        v-if="range.length == 0 && addOrSearch !== 'search'"
                        class="button is-small is-link has-text-info"
                        :title="'Add New '+ displayLabel"
                        @click.stop="add('string'); startEditing();">
                        <span class="icon">
                            <i
                                class="fa fa-plus has-text-info"
                                aria-hidden="true" />
                        </span>
                        <span>
                            Add {{ displayLabel }}
                        </span>
                    </button>
                    <button
                        v-for="(targetType) in range"
                        :key="targetType"
                        v-else-if="addOrSearch !== 'search'"
                        class="button is-small is-text has-text-info"
                        @click.stop="add(targetType); startEditing();"
                        :title="'Add New '+ displayLabel">
                        <span class="icon has-text-dark">
                            <i
                                class="fa fa-plus has-text-info"
                                aria-hidden="true" />
                        </span>
                        <span>
                            Add {{ displayLabel }}
                        </span>
                    </button>
                    <span
                        v-if="profile && profile[expandedProperty] && profile[expandedProperty]['iframePath'] && addOrSearch !== 'add'"
                        title="Search"
                        @click.stop="add('search')"
                        class="button is-small is-text has-text-info">
                        <span class="icon">
                            <i class="fa fa-search has-text-info" />
                        </span>
                        <span class="has-text-info">Search</span>
                    </span>
                </div>
            </li>
        </ul>
        <!-- special property -->
        <div
            class="special-property"
            v-if="iframePath">
            <span class="special-property__label">

                <span class="special-property-text subtitle is-size-3">{{ profile[expandedProperty]["iframeText"] }}</span>
                <div
                    class="button is-dark is-small is-pulled-right"
                    @click.stop="removeIframe">
                    <span class="has-text-weight-bold">cancel search</span>
                    <span
                        class="icon has-text-white">
                        <i
                            class="fa fa-times has-text-white"
                            aria-hidden="true" />
                    </span>
                </div>
            </span>
            <iframe
                :src="iframePath"
                width="100%" />
        </div>
    </li>
</template>
<script>
import PropertyString from './PropertyString.vue';
export default {
    // Property represents one property of a Thing.
    name: 'Property',
    props: {
        // The expandedThing that we're a property of.
        expandedThing: Object,
        // Our fully qualified property id (relative to this.expandedThing)
        expandedProperty: String,
        // The schema segment that describes us.
        schema: Object,
        // Whether the thing is editable by the current user.
        canEdit: Boolean,
        // Application profile, to pass along to the Thing children we have.
        profile: Object,
        isEditing: Boolean,
        isEditingContainer: Boolean
    },
    data: function() {
        return {
            editingThingClass: '',
            // True if we are in edit mode.
            edit: null,
            // True if we should be showing ourself.
            show: true,
            iframePath: null,
            unsaved: [],
            langString: false,
            addOrSearch: null
        };
    },
    components: {
        // Circular references require this trick.
        Thing: () => import('./Thing.vue'),
        // Property editing box for String type things. Should be one of these for each value type.
        PropertyString: PropertyString
    },
    created: function() {
        window.addEventListener('message', this.removeIframe, false);
    },
    computed: {
        childProfile: function() {
            var isFunction = function(obj) {
                return !!(obj && obj.constructor && obj.call && obj.apply);
            };
            if (this.schema == null) return null;
            var p = this.schema.profile;
            if (isFunction(p)) {
                p = p();
            }
            return p;
        },
        // Display label for the property.
        displayLabel: function() {
            // Look in schema first
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            !EcArray.isArray(this.schema["http://www.w3.org/2000/01/rdf-schema#label"]) &&
            !EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"];
            }
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            EcArray.isArray(this.schema["http://www.w3.org/2000/01/rdf-schema#label"]) &&
            EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"][0])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
            }
            if (this.schema != null && this.schema["http://www.w3.org/2000/01/rdf-schema#label"] != null &&
            EcObject.isObject(this.schema["http://www.w3.org/2000/01/rdf-schema#label"])) {
                return this.schema["http://www.w3.org/2000/01/rdf-schema#label"]["@value"];
            }

            // Make something up from the property name.
            var property = this.expandedProperty.split("/").pop();
            return property.replace(/([A-Z]+)/g, function(m) {
                return " " + m;
            }).toLowerCase().trim().replace(/(^| )(\w)/g, function(x) {
                return x.toUpperCase();
            });
        },
        // Description of the property, for hover or information hovers.
        comment: function() {
            if (this.schema == null) return null;
            if (this.schema['http://www.w3.org/2000/01/rdf-schema#comment'] == null) return null;
            if (this.schema['http://www.w3.org/2000/01/rdf-schema#comment'][0] == null) return null;
            return this.schema['http://www.w3.org/2000/01/rdf-schema#comment'][0]['@value'];
        },
        // The fully qualified property id.
        type: function() {
            if (this.schema == null) {
                if (this.expandedThing == null) {
                    return null;
                }
                return this.expandedThing["@type"][0];
            }
            return this.schema["@id"];
        },
        // The shortened (one word) property id.
        shortType: function() {
            if (!this.type) {
                return this.displayLabel;
            }
            var short = this.type.split("/").pop();
            if (short.indexOf("core#") !== -1) {
                short = this.type.split("#").pop();
            }
            return short;
        },
        // The namespace of the property id.
        context: function() {
            var ary = this.type.split("/");
            ary.pop();
            return ary.join("/");
        },
        // The permitted list of types that can go into this property.
        range: function() {
            // TODO: Inheritance tree
            if (this.schema == null) return [];
            var results = [];
            var ary = this.schema["http://schema.org/rangeIncludes"];
            if (ary != null || ary !== undefined) {
                for (var i = 0; i < ary.length; i++) {
                    results.push(ary[i]["@id"]);
                }
            }
            return results;
        },
        // The current value(s) of the property based on the expanded thing.
        expandedValue: {
            get: function() {
                var expanded = this.expandedThing[this.expandedProperty];
                if (this.expandedProperty.indexOf("@") === 0) {
                    expanded = [{"@value": this.expandedThing[this.expandedProperty]}];
                }
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["valuesIndexed"]) {
                    expanded = [];
                    var f = this.profile[this.expandedProperty]["valuesIndexed"];
                    f = f();
                    var shortId = EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]);
                    if (f && f[shortId]) {
                        return f[shortId];
                    }
                    return [];
                }
                return expanded;
            }
        },
        // Checks cardinality of the property and doesn't allow user to add more than one value when max is 1
        canAdd: function() {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["max"] === 1) {
                if (this.expandedValue.length === 1) {
                    return false;
                }
            }
            if (!this.edit && (this.isEditing || this.isEditingContainer)) {
                return false;
            }
            return this.canEdit;
        },
        // Used to remove click event when item should not be edited. Necessary because of event propagation and nested components.
        clickHandler: function() {
            if (this.canEdit) {
                return "click";
            } else {
                return null;
            }
        }
    },
    methods: {
        stopEditing: function() {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["isRequired"] === 'true') {
                if (this.expandedValue.length === 0 || (this.expandedValue[0]["@value"] != null && this.expandedValue[0]["@value"] !== undefined && this.expandedValue[0]["@value"].trim().length === 0)) {
                    this.showModal("required");
                    return;
                }
            }
            if (this.range.length === 1 && (this.range[0] === "http://schema.org/URL" || this.range[0] === "https://schema.cassproject.org/0.4/skos/Concept")) {
                for (var i = 0; i < this.unsaved.length; i++) {
                    if (this.unsaved[i].indexOf("http") === -1) {
                        return this.showModal("urlOnly");
                    }
                }
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (this.expandedValue[i]["@value"] && this.expandedValue[i]["@value"].indexOf("http") === -1) {
                        return this.showModal("urlOnly");
                    } else if (this.expandedValue[i]["@id"] && this.expandedValue[i]["@id"].indexOf("http") === -1) {
                        return this.showModal("urlOnly");
                    }
                }
            }
            this.addOrSearch = null;
            if (this.range.length === 1 && this.range[0].toLowerCase().indexOf("langstring") !== -1) {
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (this.expandedValue[i]["@language"] == null || this.expandedValue[i]["@language"] === undefined || this.expandedValue[i]["@language"].trim().length === 0) {
                        return this.showModal("langRequired");
                    }
                }
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["onePerLanguage"] === 'true') {
                    var languagesUsed = [];
                    for (var i = 0; i < this.expandedValue.length; i++) {
                        if (languagesUsed.includes(this.expandedValue[i]["@language"].toLowerCase())) {
                            return this.showModal("onePerLanguage");
                        }
                        languagesUsed.push(this.expandedValue[i]["@language"].toLowerCase());
                    }
                }
            }
            this.$emit('editingThingEvent', false);
            this.editingThingClass = "";
            this.edit = false;
            this.langString = false;
            for (var i = this.expandedValue.length - 1; i >= 0; i--) {
                if (this.expandedValue[i] === null || (this.expandedValue[i]["@value"] !== null && this.expandedValue[i]["@value"] !== undefined && this.expandedValue[i]["@value"].length === 0) || this.expandedValue[i].length === 0) {
                    this.expandedValue.splice(i, 1);
                }
            }
            this.save();
        },
        startEditing: function() {
            if (this.canEdit && !this.isEditing && !this.isEditingContainer) {
                this.edit = true;
                this.editingThingClass = "editing";
                this.$emit('editingThingEvent', true);
            }
            if (this.range.length === 1 && this.range[0].toLowerCase().indexOf("langstring") !== -1) {
                this.langString = true;
                for (var i = 0; i < this.expandedValue.length; i++) {
                    if (!this.expandedValue[i]["@language"]) {
                        this.update({"@language": "", "@value": this.expandedValue[i]["@value"]}, i);
                    }
                }
            }
        },
        /*
         * initialize modal with params this depends on
         * ./plugins/modalPlugin.js;
         * and ./components/CassModal.vue;
         * can further breakout if we decide to use vuex // plugin is global
         */
        showModal(val, item) {
            let params = {};
            if (val === 'remove') {
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["isRequired"] === 'true') {
                    if (this.expandedValue.length === 1 || (this.expandedValue["@value"] && this.expandedValue["@value"].trim().length === 1)) {
                        this.showModal("required");
                        return;
                    }
                }
                params = {
                    type: val,
                    title: "Remove property",
                    text: "Remove this property?",
                    onConfirm: () => {
                        return this.remove(item);
                    }
                };
            }
            if (val === 'remove unsaved') {
                params = {
                    type: val,
                    title: "Remove compentecy",
                    text: "Are you sure you want to remove this property?",
                    onConfirm: () => {
                        return this.remove(item, 'unsaved');
                    }
                };
            }
            if (val === 'required') {
                params = {
                    type: val,
                    title: "Required property",
                    text: "This property is required. Please enter a value."
                };
            }
            if (val === "urlOnly") {
                params = {
                    type: val,
                    title: "URL Required",
                    text: "This property must be a URL. For example: https://credentialengineregistry.org/, https://eduworks.com, https://case.georgiastandards.org/."
                };
            }
            if (val === "langRequired") {
                params = {
                    type: val,
                    title: "Language Required",
                    text: "This property must have a language."
                };
            }
            if (val === "onePerLanguage") {
                params = {
                    type: val,
                    title: "One value per language",
                    text: "This field can only have one entry per language."
                };
            }
            // reveal modal
            this.$modal.show(params);
        },
        add: function(type) {
            if (type === "search") {
                this.addOrSearch = "search";
                this.$store.commit("editor/selectCompetencyRelation", this.expandedProperty);
                this.$store.commit("editor/selectingCompetencies", true);
                var selectedCompetency = EcRepository.getBlocking(this.expandedThing["@id"]);
                this.$store.commit("editor/selectedCompetency", selectedCompetency);
                if (this.expandedProperty.indexOf("/") !== -1) {
                    var type = this.expandedThing["@type"][0];
                    var rawSchemataURL = type.substring(0, type.lastIndexOf("/"));
                    var context = this.$store.state.lode.rawSchemata[rawSchemataURL]["@context"];
                    for (let key in context) {
                        if (this.expandedProperty.indexOf(context[key]) !== -1) {
                            this.$store.commit("editor/selectCompetencyRelation", key + ":" + this.expandedProperty.split("/").pop());
                            break;
                        }
                    }
                }
                this.iframePath = this.profile[this.expandedProperty]["iframePath"];
            } else if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["add"]) {
                this.addOrSearch = "add";
                var f = this.profile[this.expandedProperty]["add"];
                if (f === "unsaved") {
                    this.unsaved.push("");
                } else {
                    var shortId = EcRemoteLinkedData.trimVersionFromUrl(this.expandedThing["@id"]);
                    f(shortId);
                }
            } else if (type.toLowerCase().indexOf("langstring") !== -1) {
                this.addOrSearch = "add";
                var lang = "";
                if (this.$store.state.editor) {
                    lang = this.$store.state.editor.defaultLanguage;
                }
                this.$parent.add(this.expandedProperty, {"@language": lang, "@value": ""});
                this.langString = true;
            } else if (type.toLowerCase().indexOf("string") !== -1 || type.toLowerCase().indexOf("url") !== -1 || type.toLowerCase().indexOf("text") !== -1 ||
                type.toLowerCase().indexOf("date") !== -1 || type.toLowerCase().indexOf("concept") !== -1) {
                this.addOrSearch = "add";
                this.$parent.add(this.expandedProperty, {"@value": ""});
            } else {
                this.addOrSearch = "add";
                var rld = new EcRemoteLinkedData();
                rld.context = this.context;
                rld.type = type.split("/").pop();
                this.$parent.add(this.expandedProperty, rld);
            }
        },
        remove: function(index, unsaved) {
            if (unsaved) {
                this.unsaved.splice(index, 1);
            } else if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["remove"]) {
                var f = this.profile[this.expandedProperty]["remove"];
                var value = EcObject.isObject(this.expandedValue[index]) ? this.expandedValue[index]["@id"] : this.expandedValue[index];
                f(this.expandedThing["@id"], value);
            } else {
                this.$parent.remove(this.expandedProperty, index);
            }
        },
        update: function(input, index) {
            this.$parent.update(this.expandedProperty, index, input);
        },
        isText: function(type) {
            if (type == null || type === undefined) return null;
            if (type["@value"] != null && type["@value"] !== undefined) {
                return true;
            }
            if (type["@type"] !== undefined && type["@type"] !== null) {
                if (type["@type"][0].toLowerCase().indexOf("text") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("url") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("concept") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("string") !== -1) { return true; }
            }
            if (type["@id"] != null && type["@id"] !== undefined) { return true; }
            return false;
        },
        isLink: function(type) {
            if (EcObject.keys(type).length === 1) {
                if (type["@id"] != null && type["@id"] !== undefined) {
                    return true;
                } else if (type["@value"] && type["@value"].indexOf("http") !== -1) {
                    return true;
                }
            }
            return false;
        },
        save: function() {
            if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["save"]) {
                var f = this.profile[this.expandedProperty]["save"];
                f(this.expandedThing, this.unsaved);
                this.unsaved.splice(0, this.unsaved.length);
            } else {
                this.$parent.save();
            }
        },
        isObject: function(k) { return EcObject.isObject(k); },
        removeIframe: function(event) {
            if (!event.data || event.data.message === "selected") {
                this.iframePath = null;
                this.addOrSearch = null;
            }
        },
        deleteObject: function(thing) {
            this.$emit('deleteObject', thing);
        }
    },
    watch: {
        canEdit: function() {
            if (this.canEdit === false) {
                this.edit = false;
            }
        }
    }
};
</script>
