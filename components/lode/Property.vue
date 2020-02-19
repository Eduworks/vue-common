<template>
    <li
        v-if="thing"
        :class="['e-Property e-' + shortType, editingThingClass, { 'has-value': value}]">
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
            v-if="value && show">
            <li
                v-for="(item,index) in expandedValue"
                :key="index"
                class="property-value"
                @click="startEditing()">
                <input
                    v-if="selectMode && shortType==='Level'"
                    type="checkbox"
                    v-model="checked[item['@id']]">
                <Thing
                    v-if="!edit && isLink(item) && property != 'id' && property != 'registryURL'"
                    :uri="item['@id'] || item['@value']"
                    clickToLoad="true"
                    :parentNotEditable="!canEdit"
                    :profile="childProfile"
                    class="related-competency" />
                <Thing
                    :obj="value[index]"
                    :expandedObj="item"
                    v-else-if="!isText(item)"
                    :parentNotEditable="!canEdit"
                    :profile="childProfile" />
                <span v-else-if="isLink(item) && profile && profile[expandedProperty] && profile[expandedProperty]['noTextEditing']">
                    {{ item['@id'] || item['@value'] }}
                </span>
                <span v-else-if="edit && typeof(item) === 'String' && profile && profile[expandedProperty] && profile[expandedProperty]['noTextEditing']">
                    {{ item }}
                </span>
                <span v-else-if="edit && profile && profile[expandedProperty] && profile[expandedProperty]['noTextEditing']">
                    {{ item["@value"] }}
                </span>
                <!-- property string input -->
                <span
                    v-else-if="edit"
                    class="property-string-span">
                    <PropertyString
                        :index="index"
                        :property="property"
                        :thing="thing"
                        :value="item"
                        :profile="childProfile"
                        :langString="langString" />
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
                        @click="showModal('remove', index)"
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
                            class="button"
                            v-if="edit == true"
                            @click="showModal('remove unsaved', index)">
                            <span class="icon remove is-small">
                                <i
                                    class="fa fa-trash"
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
                    @click="stopEditing"
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
                    v-if="canEdit && range.length == 0"
                    @click="add('string')"
                    class="button is-pulled-right is-small is-text has-text-info add-property">
                    <span
                        class="icon"
                        title="Add New Text">
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
                    v-else-if="canEdit"
                    class="button is-small is-text has-text-info "
                    :title="'Add New '+ (targetType === 'http://www.w3.org/2000/01/rdf-schema#langString' ? 'Text' : targetType.split('/').pop())"
                    @click="add(targetType); startEditing();">
                    <span class="icon add-new">
                        <i
                            class="fa has-text-info fa-plus"
                            aria-hidden="true" />
                    </span>
                    <span class="button-text">
                        Add {{ targetType === 'http://www.w3.org/2000/01/rdf-schema#langString' ? 'Text' : targetType.split("/").pop() }}
                    </span>
                </span>
                <span
                    v-if="profile && profile[expandedProperty] && profile[expandedProperty]['iframePath']"
                    title="Search"
                    @click="add('search')"
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
            </li>
            <li
                class="add-property-button"
                v-if="canEdit">
                <button
                    v-if="range.length == 0"
                    class="button is-small is-link has-text-info"
                    title="Add New Text"
                    @click="add('string'); startEditing();">
                    <span class="icon">
                        <i
                            class="fa fa-plus has-text-info"
                            aria-hidden="true" />
                    </span>
                    <span>
                        Add Text
                    </span>
                </button>
                <button
                    v-for="(targetType) in range"
                    :key="targetType"
                    v-else
                    class="button is-small is-text has-text-info"
                    @click="add(targetType); startEditing();"
                    :title="'Add New '+ (targetType === 'http://www.w3.org/2000/01/rdf-schema#langString' ? 'Text' : targetType.split('/').pop())">
                    <span class="icon has-text-dark">
                        <i
                            class="fa fa-plus has-text-info"
                            aria-hidden="true" />
                    </span>
                    <span>
                        Add {{ targetType === 'http://www.w3.org/2000/01/rdf-schema#langString' ? 'Text' : targetType.split('/').pop() }}
                    </span>
                </button>
                <span
                    v-if="profile && profile[expandedProperty] && profile[expandedProperty]['iframePath']"
                    title="Search"
                    @click="add('search')"
                    class="button is-small is-text has-text-info">
                    <span class="icon">
                        <i class="fa fa-search has-text-info" />
                    </span>
                    <span class="has-text-info">Search</span>
                </span>
            </li>
        </ul>
        <!-- special property -->
        <div
            class="special-property"
            v-if="iframePath">
            <span
                class="icon"
                @click="removeIframe">
                <i
                    class="fa fa-times"
                    aria-hidden="true" />
            </span>
            <center><h1> {{ profile[expandedProperty]["iframeText"] }}</h1></center>
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
        // The thing that we're a property of.
        thing: Object,
        // The expandedThing that we're a property of.
        expandedThing: Object,
        // Our short property id (relative to this.thing)
        property: String,
        // Our fully qualified property id (relative to this.expandedThing)
        expandedProperty: String,
        // The schema segment that describes us.
        schema: Object,
        // Whether the thing is editable by the current user.
        canEdit: Boolean,
        // Application profile, to pass along to the Thing children we have.
        profile: Object,
        selectMode: Boolean,
        isEditing: Boolean

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
            checked: {},
            langString: false
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
            var property = this.property.split(":").pop().split("/").pop();
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
        // The current value(s) of the property. Takes care of prefix:propertyName type shenanigans.
        value: {
            get: function() {
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["valuesIndexed"]) {
                    var f = this.profile[this.expandedProperty]["valuesIndexed"];
                    f = f();
                    if (f && f[this.thing.shortId()]) {
                        return f[this.thing.shortId()];
                    }
                    return [];
                }
                var result = this.thing[this.property];
                if (result != null) return result;
                if (this.expandedValue != null) {
                    result = this.thing[this.expandedProperty];
                }
                if (result != null) return result;
                if (this.property.indexOf(":") !== -1) {
                    var property = this.property.split(':');
                    property = this.$store.state.lode.rawSchemata[this.thing.context]["@context"][property[0]] + property[1];
                    result = this.thing[property];
                }
                return result;
            }
        },
        // The current value(s) of the property based on the expanded thing.
        expandedValue: {
            get: function() {
                var expanded = this.expandedThing[this.expandedProperty];
                if (this.expandedProperty.indexOf("@") === 0) {
                    expanded = [{"@value": this.thing[this.property]}];
                }
                if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["valuesIndexed"]) {
                    expanded = [];
                    for (var i = 0; i < this.value.length; i++) {
                        if (EcObject.isObject(this.value[i])) {
                            expanded.push({"@id": this.value[i].shortId()});
                        } else {
                            expanded.push({"@id": this.value[i]});
                        }
                    }
                }
                return expanded;
            }
        }
    },
    methods: {
        stopEditing: function() {
            this.$emit('editingThingEvent', false);
            this.editingThingClass = "";
            this.edit = false;
            for (var i = this.value.length - 1; i >= 0; i--) {
                if (this.value[i] === null || (this.value[i]["@value"] !== null && this.value[i]["@value"] !== undefined && this.value[i]["@value"].length === 0) || this.value[i].length === 0) {
                    this.value.splice(i, 1);
                }
            }
            this.save();
        },
        startEditing: function() {
            this.edit = true;
            this.editingThingClass = "editing";
            this.$emit('editingThingEvent', true);
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
            // reveal modal
            this.$modal.show(params);
        },
        add: function(type) {
            if (type === "search") {
                this.$store.commit("selectingCompetencies", true);
                this.$store.commit("selectedCompetency", this.thing);
                if (this.property) {
                    this.$store.commit("selectCompetencyRelation", this.property);
                } else {
                    this.$store.commit("selectCompetencyRelation", this.expandedProperty);
                }
                this.iframePath = this.profile[this.expandedProperty]["iframePath"];
            } else if (this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["add"]) {
                var f = this.profile[this.expandedProperty]["add"];
                if (f === "unsaved") {
                    this.unsaved.push("");
                } else {
                    f(this.thing.shortId());
                }
            } else if (type.toLowerCase().indexOf("langstring") !== -1) {
                this.$parent.add(this.property, {"@language": "", "@value": ""});
                this.langString = true;
            } else if (type.toLowerCase().indexOf("string") !== -1 || type.toLowerCase().indexOf("url") !== -1 || type.toLowerCase().indexOf("text") !== -1) {
                this.$parent.add(this.property, "");
            } else {
                var rld = new EcRemoteLinkedData();
                rld.context = this.context;
                rld.type = type.split("/").pop();
                this.$parent.add(this.property, rld);
            }
        },
        remove: function(index, unsaved) {
            if (unsaved) {
                this.unsaved.splice(index, 1);
            } else if (this.profile && this.profile[this.expandedProperty] && this.profile[this.expandedProperty]["remove"]) {
                var f = this.profile[this.expandedProperty]["remove"];
                var value = EcObject.isObject(this.value[index]) ? this.value[index].shortId() : this.value[index];
                f(this.thing.shortId(), value);
            } else {
                this.$parent.remove(this.property, index);
            }
        },
        update: function(input, index) {
            this.$parent.update(this.property, index, input);
        },
        isText: function(type) {
            if (type == null || type === undefined) return null;
            if (type["@value"] != null && type["@value"] !== undefined) {
                return true;
            }
            if (type["@type"] !== undefined && type["@type"] !== null) {
                if (type["@type"][0].toLowerCase().indexOf("text") !== -1) { return true; }
                if (type["@type"][0].toLowerCase().indexOf("url") !== -1) { return true; }
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
                f(this.thing, this.unsaved);
                this.unsaved.splice(0, this.unsaved.length);
            } else {
                this.$parent.save();
            }
        },
        isObject: function(k) { return EcObject.isObject(k); },
        removeIframe: function(event) {
            if (!event.data || event.data.message === "selected") {
                this.iframePath = null;
            }
        }
    },
    watch: {
        canEdit: function() {
            if (this.canEdit === false) {
                this.edit = false;
            }
        },
        checked: {
            deep: true,
            handler() {
                var parent = this.$parent;
                while (parent.select == null) { parent = parent.$parent; }
                for (var key in this.checked) {
                    parent.select(key, this.checked[key]);
                }
            }
        }
    }
};
</script>
