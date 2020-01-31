<template>
    <div class="thing">
        <button
            v-if="clickToLoad"
            @click="load">
            Load {{ uri }}
        </button>
        <!-- shortType can be Competency, organization, or person -->
        <!-- event emitter is used to tell the parent to expand / collapse if possible
                ignored bottom 32px to account for toolset bar  -->
        <div
            v-else-if="expandedThing"
            :class="['e-Thing e-'+shortType, hoverClass]"
            @mouseover="handleMouseOverThing()"
            @mouseout="handleMouseOutThing()"
            @click="emitExpandEvent($event)">
            <!--<div
                class="clickable-hierarchy"
                 />-->
            <a
                v-if="expandedThing['@id']"
                class="e-type"
                :href="expandedThing['@id']">
                <span
                    :title="type"
                    v-if="shortType">{{ shortType }}
                </span>
            </a>
            <span
                v-else-if="shortType"
                class="e-type"
                :title="type">{{ shortType }}</span>
            <!-- confirm dialog not sure if needed
                <div
                    v-if="confirmDialog"
                    class="confirm-delete-dialog">
                    <div class="columns">
                        <div class="column is-8">
                            <span class="is-size-7 has-text-warning">{{ confirmText }}</span>
                        </div>
                        <div class="column is-4">
                            <div class="buttons is-vcentered is-right">
                                <button
                                    class="button is-small is-link"
                                    @click="confirmAction">Confirm</button>
                                <button
                                    class="button is-small is-dark"
                                    @click="confirmDialog=false">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>-->
            <div
                class="thing-actions is-size-7">
                <!-- information: editable, number of children-->
                <div class="info">
                    <span
                        v-if="canEdit"
                        class="icon editable is-small">
                        <i
                            class="fa fa-key"
                            aria-hidden="true"
                            title="Is Editable" />
                    </span>
                    <span
                        v-else
                        class="icon not-editable is-small">
                        <i
                            class="fa fa-lock"
                            aria-hidden="true"
                            title="Not editable" />
                    </span>
                    <span v-if="children">
                        Children: {{ children }}
                    </span>
                </div>
                <!-- view options: primary, secondary, tertiary -->
                <div class="view">
                    <div class="buttons">
                        <span
                            @click="showAlways = true; showPossible = false;"
                            class="button is-text">
                            <span
                                :class="{ 'active': showAlways === true && showPossible === false}"
                                class="icon compact is-small">
                                <i
                                    class="fa fa-window-minimize"
                                    aria-hidden="true"
                                    title="Show Required Only" />
                            </span>
                        </span>
                        <span
                            @click="showAlways = false; showPossible = null;"
                            class="button is-text">
                            <span
                                :class="{ 'active': showAlways === false && showPossible === null }"
                                class="icon expand is-small">
                                <i
                                    class="fa fa-list"
                                    aria-hidden="true"
                                    title="Show Entered Properties" />
                            </span>
                        </span>
                        <span
                            v-if="canEdit"
                            class="button is-text"
                            @click="showAlways = false; showPossible = true;">
                            <span
                                :class="{ 'active': showAlways === false && showPossible === true}"
                                class="icon expand is-small">
                                <i
                                    class="fa fa-globe"
                                    aria-hidden="true"
                                    title="Show All Available" />
                            </span>
                        </span>
                    </div>
                </div>
                <!-- actions: delete, add, remote -->
                <div class="action">
                    <div class="buttons">
                        <span
                            @click="showModal('deleteObject')"
                            class="button is-light"
                            v-if="canEdit">
                            <span
                                class="icon delete-thing is-small">
                                <i
                                    class="fa fa-trash"
                                    aria-hidden="true"
                                    title="Delete" />
                            </span>
                        </span>
                        <!-- remove object -->
                        <span
                            @click="showModal('removeObject')"
                            class="button is-light"
                            v-if="canEdit && obj.type === 'Competency'">
                            <span
                                class="icon remove is-small">
                                <i
                                    class="fa fa-minus-circle"
                                    aria-hidden="true"
                                    title="Remove (but don't delete)" />
                            </span>
                        </span>
                        <!-- export -->
                        <span
                            v-if="exportOptions"
                            @click="showModal('export')"
                            class="button is-light">
                            <span class="is-small export icon">
                                <i class="fa fa-file-export" />
                            </span>
                        </span>
                        <!-- add node -->
                        <span class="button is-light">
                            <span
                                class="icon add is-small">
                                <i
                                    class="fa fa-plus-circle"
                                    aria-hidden="true"
                                    title="Show Required Only"
                                    @click="$emit('addNode')" />
                            </span>
                        </span>
                    </div>
                </div>
                <!-- delete confirm move to dialog -->
                <!--<div
                    class="icon export is-right"
                    v-if="exportOptions">
                    <div class="dropdown-trigger">
                        <span class="icon is-small">
                            <i
                                class="fa fa-file-export"
                                aria-hidden="true"
                                title="Export"
                                @click="showConfirmDialog('removeObject')" />
                        </span>
                    </div>
                    <div class="dropdown-menu">
                        <div class="dropdown-content">
                            <div
                                class="dropdown-item"
                                v-for="option in exportOptions"
                                :key="option"
                                @click="exportObject(option.value)">
                                {{ option.name }}
                            </div>
                        </div>
                    </div>
                </div>-->
            </div>
            <slot />
            <!-- this is the primary / required properties -->
            <ul
                class="e-Thing-always-ul e-Thing-ul"
                :class="{highlighted: highlighted}"
                v-if="showAlways == true && expandedThing != null && expandedThing !== undefined">
                <Property
                    v-for="(value,key) in alwaysProperties"
                    :key="key"
                    :thing="thing"
                    :expandedThing="expandedThing"
                    :property="getKeyFromMap(key)"
                    :expandedProperty="key"
                    :schema="value"
                    :canEdit="canEdit"
                    :profile="profile" />
                <slot name="frameworkTags" />
            </ul>
            <!-- this is the secondary / contains properties -->
            <ul
                class="e-Thing-possible-ul e-Thing-ul"
                :class="{highlighted: highlighted}"
                v-else-if="showPossible == true && expandedThing != null && expandedThing !== undefined">
                <Property
                    v-for="(value,key) in possibleProperties"
                    :key="key"
                    :thing="thing"
                    :expandedThing="expandedThing"
                    :property="getKeyFromMap(key)"
                    :expandedProperty="key"
                    :schema="value"
                    :canEdit="canEdit"
                    :profile="profile"
                    :specialProperty="specialProperties ? specialProperties[key] : null"
                    :specialPropertiesValues="specialPropertiesValuesLocal ? specialPropertiesValuesLocal[key] : null" />
            </ul>
            <!-- here we have the expandable / does not contain value for properties -->
            <ul
                class="e-Thing-view-ul e-Thing-ul"
                :class="{highlighted: highlighted}"
                v-else-if="expandedThing != null && expandedThing !== undefined">
                <Property
                    v-for="(value,key) in viewProperties"
                    :key="key"
                    :thing="thing"
                    :expandedThing="expandedThing"
                    :property="getKeyFromMap(key)"
                    :expandedProperty="key"
                    :schema="value"
                    :canEdit="canEdit"
                    :profile="profile"
                    :specialProperty="specialProperties ? specialProperties[key] : null"
                    :specialPropertiesValues="specialPropertiesValuesLocal ? specialPropertiesValuesLocal[key] : null" />
            </ul>
        </div>
    </div>
</template>

<script>
import Property from './Property.vue';
export default {
    // Thing represents a JSON-LD object. Does not have to be based on http://schema.org/Thing.
    name: 'Thing',
    props: {
        // (Optional) Object that will be turned into the Thing during initialization.
        obj: Object,
        // (Optional) Expanded Object (if any) that will be turned into the ExpandedThing during initialization.
        children: Number,
        expandedObj: Object,
        // (Optional) URI/URL to an object to go fetch, in lieu of the above two.
        uri: String,
        // If the uri is specified, whether we should delay loading. (prevents infinite loops)
        clickToLoad: Boolean,
        // True if the parent isn't editable, this shouldn't be either. Overrides canEdit.
        parentNotEditable: Boolean,
        // Application profile used to constrain and respecify properties that are to be made editable.
        profile: Object,
        exportOptions: Array,
        highlightList: Array,
        specialProperties: Object,
        specialPropertiesValues: Object
    },
    components: {
        Property
    },
    data: function() {
        return {
            actionOptions: [
                {
                    name: 'edit',
                    value: this.canEdit,
                    action: ''
                }

            ],
            hoverClass: '',
            // After initialization, this will hold the thing we're displaying/CRUDing.
            thing: null,
            // After initialization and expansion, this will hold the fully expanded thing we're displaying/CRUDing.
            expandedThing: null,
            // True if we are in the compacted (alwaysProperties) property display mode. In the middle of this and showPossible is all properties that we can view.
            showAlways: true,
            // True if we are in the fully expanded (possibleProperties) property display mode. Only relevant if we can edit the object.
            showPossible: true,
            // The raw schema, uncomputed-over schema objects. Kept for internal processing reasons.
            rawSchema: null,
            // Used to avoiding calling getThingKeyFromExpandedKey for every update.
            keyMap: {},
            confirmDialog: false,
            confirmText: null,
            confirmAction: null
        };
    },
    created: function() {
        if (this.clickToLoad === false) { this.load(); }
    },
    computed: {
        // Get the fully qualified type of the thing. eg: http://schema.org/Person
        type: function() {
            if (this.expandedThing == null) {
                return null;
            }
            return this.expandedThing["@type"][0];
        },
        // Get the short (one word) type of the thing. eg: Person
        shortType: function() {
            if (this.expandedThing == null) {
                return null;
            }
            return this.expandedThing["@type"][0].split("/").pop();
        },
        // Get the canonical namespace/context prefix of the type. eg: http://schema.org/ -- WARNING: This is not the @context as specified by the Thing.
        context: function() {
            // TODO: Rename 'namespace' -- context is confusing.
            var ary = this.type.split("/");
            ary.pop();
            return ary.join("/");
        },
        // True if the current client can edit this object.
        canEdit: function() {
            if (this.parentNotEditable === true) {
                return false;
            }
            return this.thing.canEditAny(EcIdentityManager.getMyPks());
        },
        // Fetches a map of fully qualified property identifiers to the full @graph property specifications.
        schema: function() {
            var schema = this.rawSchema;
            var result = {};
            if (schema !== null && schema !== undefined) {
                for (var i = 0; i < schema.length; i++) {
                    var r = schema[i];
                    result[r["@id"]] = r;
                }
            }
            return result;
        },
        // Map of fully qualified property ids to schema items that should always be shown (if available) at the top for any object.
        alwaysProperties: function() {
            var result = {};
            if (this.profile && this.profile["alwaysProperties"]) {
                for (var i = 0; i < this.profile["alwaysProperties"].length; i++) {
                    var prop = this.profile["alwaysProperties"][i];
                    result[prop] = this.profile[prop];
                }
                return result;
            }
            var props = [
                "http://schema.org/name", "http://schema.org/description", "http://purl.org/dc/terms/title", "http://purl.org/dc/terms/description",
                "http://www.w3.org/2004/02/skos/core#prefLabel", "http://www.w3.org/2004/02/skos/core#definition"
            ];
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];

                if (this.profile == null || (this.profile != null && this.profile[prop] !== undefined)) {
                    if (this.schema[prop] != null) {
                        if (this.expandedThing[prop] != null && this.expandedThing[prop].length !== 0) {
                            if (this.profile != null) {
                                result[prop] = this.profile[prop];
                            } else {
                                result[prop] = this.schema[prop];
                            }
                        }
                    }
                }
            }
            return result;
        },
        // Map of fully qualified property ids to schema items, limited to properties that have data in them, shown in the first level of breakout. Configurable via the profile property.
        viewProperties: function() {
            var result = {};
            for (var key in this.alwaysProperties) { result[key] = this.alwaysProperties[key]; }
            for (var key in this.expandedThing) {
                if (key === "constructor") continue;
                if (key === "@id") continue;
                if (key === "@type") continue;
                if (key === "@context") continue;
                if (key.endsWith("@owner")) continue;
                if (key.endsWith("@reader")) continue;
                if (key.endsWith("@signature")) continue;
                // If it doesn't exist in the profile, don't show it.
                if (this.profile != null && this.profile[key] === undefined) {
                    continue;
                }
                // If it doesn't exist in the data, don't show it.
                if (this.expandedThing[key] == null || this.expandedThing[key].length === 0) {
                    continue;
                }
                // If it does exist in the profile, use the schema from the profile.
                if (this.profile != null) {
                    result[key] = this.profile[key];
                    continue;
                }
                // If there is no profile, use the schema from the schema.
                if (this.schema[key] != null && this.schema[key] !== undefined) {
                    result[key] = this.schema[key];
                    continue;
                }
                // If it doesn't exist in the schema, use the 'schemaFallback'.
                result[key] = this.$store.state.lode.schemaFallback[key];
            }
            if (this.profile) {
                for (var key in this.profile) {
                    if (this.profile[key]["valuesIndexed"]) {
                        var f = this.profile[key]["valuesIndexed"];
                        f = f();
                        if (f && f[this.thing.shortId()]) {
                            result[key] = this.profile[key];
                        }
                    }
                }
            }
            if (this.specialPropertiesValues) {
                for (var key in this.specialPropertiesValues) {
                    if (this.specialProperties[key]) {
                        result[key] = this.specialProperties[key];
                    }
                }
            }
            return result;
        },
        // Map of fully qualified property ids to schema items, unlimited, shown in the second level of breakout. Configurable via the profile property.
        possibleProperties: function() {
            var result = {};
            for (var key in this.viewProperties) { result[key] = this.viewProperties[key]; }
            if (this.profile != null) {
                for (var key in this.profile) {
                    if (key !== "alwaysProperties") {
                        result[key] = this.profile[key];
                    }
                }
            } else {
                for (var key in this.schema) {
                    if (key === "constructor") continue;
                    if (key === "@id") continue;
                    if (key === "@type") continue;
                    if (key === "@context") continue;
                    if (key.endsWith("@owner")) continue;
                    if (key.endsWith("@reader")) continue;
                    if (key.endsWith("@signature")) continue;
                    if (this.profile != null && this.profile[key] === undefined) {
                        continue;
                    }
                    if (this.schema[key]["@type"] === undefined && this.schema[key]["http://schema.org/domainIncludes"] === undefined) {
                        continue;
                    }
                    if (this.schema[key]["@type"] != null && this.schema[key]["@type"][0].indexOf("Property") === -1) {
                        continue;
                    }
                    // If there is no profile, use the schema from the schema.
                    if (this.schema[key] != null && this.schema[key] !== undefined) {
                        result[key] = this.schema[key];
                        continue;
                    }
                    // If it doesn't exist in the schema, use the 'schemaFallback'.
                    result[key] = this.$store.state.lode.schemaFallback[key];
                }
            }
            if (this.specialProperties) {
                for (var key in this.specialProperties) {
                    result[key.toLowerCase()] = this.specialProperties[key];
                }
            }
            return result;
        },
        // Attempt to get icons for types. Failed pretty miserably.
        iconClass: function() {
            return "fas fa-" + this.shortType.toLowerCase();
        },
        highlighted: function() {
            if (this.highlightList) {
                for (var i = 0; i < this.highlightList.length; i++) {
                    if (this.thing.shortId() === this.highlightList[i] || this.thing.id === this.highlightList[i]) {
                        return true;
                    }
                }
            }
            return false;
        },
        specialPropertiesValuesLocal: function() {
            return this.specialPropertiesValues;
        }
    },
    methods: {
        emitExpandEvent: function(e) {
            console.log("expand", e.target);
            this.$emit('expandEvent');
        },
        handleMouseOverThing: function() {
            this.hoverClass = 'showHoverItems';
        },
        handleMouseOutThing: function() {
            this.hoverClass = '';
        },
        /*
         * initialize modal with params this depends on
         * ./plugins/modalPlugin.js;
         * can possibly be moved to a mixin
         * and ./components/CassModal.vue;
         * can further breakout if we decide to use vuex // plugin is global
         * this modal depends on cass-editor repo, not sure what we
         * should do here to future proof the LODE repo. Might be a better solution.
         */
        showModal(val) {
            let params = {};
            if (val === 'deleteObject') {
                params = {
                    type: val,
                    title: "Delete competency",
                    text: "Warning! This action deletes the competency in its entirety.  If you just want to remove the competency from the framework, use the \"remove\" function",
                    onConfirm: () => {
                        return this.deleteObject();
                    }
                };
            }
            if (val === 'removeObject') {
                params = {
                    type: val,
                    title: "Remove competency",
                    text: "Removing a competency safely removes it from your framework without removing it from the system.",
                    onConfirm: () => {
                        return this.removeObject();
                    }
                };
            }
            if (val === 'export') {
                console.log("options", typeof this.exportOptions);
                params = {
                    type: val,
                    selectedExportOption: '',
                    title: "Export Competency",
                    exportOptions: this.exportOptions,
                    text: "Select a file format to export your competency. Files download locally.",
                    onConfirm: (e) => {
                        return this.exportObject(e);
                    }
                };
            }
            // reveal modal
            this.$modal.show(params);
        },

        load: function() {
            var me = this;
            me.clickToLoad = false;
            if (this.uri != null) {
                // If we have a uri, go get the data from the uri and continue loading.
                EcRepository.get(
                    this.uri,
                    function(t) {
                        var allTypes = me.getAllTypes(t);
                        if (t.context != null && t.context !== undefined) {
                            allTypes.push(t.context);
                        }
                        new EcAsyncHelper().each(allTypes, function(type, callback) {
                            me.loadSchema(callback, type);
                        }, function() {
                            me.thing = me.deserialize(t);
                            me.expand(function() {
                                me.rawSchema = me.$store.state.lode.schemata[me.type];
                            });
                        });
                    },
                    console.error
                );
            } else {
                if (this.expandedObj != null) {
                    // If we don't have an expandedObj provided, expand whatever is in obj and continue loading.
                    if (this.obj != null) {
                        this.thing = this.obj;
                    }
                    this.loadSchema(function() {
                        me.expandedThing = me.expandedObj;
                        me.rawSchema = me.$store.state.lode.schemata[me.type];
                    }, this.expandedObj["@type"][0]);
                } else {
                    var allTypes = me.getAllTypes(this.obj);
                    if (this.obj.context != null && this.obj.context !== undefined) {
                        allTypes.push(this.obj.context);
                    }
                    new EcAsyncHelper().each(allTypes, function(type, callback) {
                        me.loadSchema(callback, type);
                    }, function() {
                        me.thing = me.deserialize(me.obj);
                        me.expand(function() {
                            me.rawSchema = me.$store.state.lode.schemata[me.type];
                        });
                    });
                }
            }
        },
        // Fleshes out the Thing object with empty containers for any possible field that can be edited, according to the schema. Permits reactivity of currently unused fields.
        reactify: function(o) {
            var schema = null;
            var context = o.context;
            if (context.indexOf("skos") !== -1) {
                context = "https://schema.cassproject.org/0.4/skos/";
            }
            if (o.type != null) {
                schema = this.$store.state.lode.schemata[context + (context.endsWith("/") ? "" : "/") + o.type];
            }
            if (o["@type"] != null) {
                schema = this.$store.state.lode.schemata[o["@context"] + (o["@context"].endsWith("/") ? "" : "/") + o["@type"]];
            }
            if (schema != null) {
                jsonld.compact(schema, this.$store.state.lode.rawSchemata[context]["@context"], function(err, compacted) {
                    if (err) {
                        console.log(err);
                    } else {
                        for (var i = 0; i < compacted["@graph"].length; i++) {
                            var key = compacted["@graph"][i]["@id"];
                            if (compacted["@graph"][i]["@type"] === undefined && compacted["@graph"][i]["http://schema.org/domainIncludes"] === undefined) continue;
                            if (compacted["@graph"][i]["@type"] != null && compacted["@graph"][i]["@type"][0].indexOf("Property") === -1 && compacted["@graph"][i]["@type"].indexOf("Property") === -1) continue;
                            if (o[key] == null) {
                                o[key] = [];
                            } else if (!EcArray.isArray(o[key])) {
                                o[key] = [o[key]];
                            }
                        }
                    }
                });
            }
        },
        // Turns all objects into EcRemoteLinkedData objects. Also 'reactifies' all the data.
        deserialize: function(o) {
            if (EcArray.isArray(o)) {
                for (var i = 0; i < o.length; i++) {
                    o[i] = this.deserialize(o[i]);
                }
            }
            if (EcObject.isObject(o)) {
                if (o["@language"] != null) { return o; }
                if (o["@value"] != null) { return o; }
                for (var key in o) {
                    o[key] = this.deserialize(o[key]);
                }
                if (o.type != null) {
                    var l = new EcRemoteLinkedData();
                    l.copyFrom(o);
                    o = l;
                }
                if (o['@type'] != null) {
                    var l = new EcRemoteLinkedData();
                    l.copyFrom(o);
                    o = l;
                }
                this.reactify(o);
            }
            return o;
        },
        // Performs a JSON-LD Processor 'expand' operation that disambiguates and attaches a namespace for each property. Places result in expandedThing. Does not use the schema, uses the @context of the thing.
        expand: function(after) {
            var me = this;
            var toExpand = JSON.parse(this.thing.toJson());
            if (toExpand["@context"] != null && toExpand["@context"].startsWith("http://")) {
                toExpand["@context"] = toExpand["@context"].replace("http://", "https://");
            }
            if (toExpand["@context"] != null && toExpand["@context"].indexOf("skos") !== -1) {
                toExpand["@context"] = "https://schema.cassproject.org/0.4/skos/";
            }
            jsonld.expand(toExpand, function(err, expanded) {
                if (err == null) {
                    me.expandedThing = expanded[0];
                    me.loadSchema(after);
                } else {
                    console.error(err);
                }
            });
        },
        // Loads the schema (not the context!) for this object, if available and if it is where it should be (at the url of the fully qualified @type).
        loadSchema: function(after, type) {
            var me = this;
            if (type == null) type = this.type;
            if (type === "http://schema.org/") {
                after();
                return;
            } else if (type.indexOf("ConceptScheme") !== -1) {
                type = "https://schema.cassproject.org/0.4/skos/ConceptScheme";
            } else if (type.indexOf("Concept") !== -1) {
                type = "https://schema.cassproject.org/0.4/skos/Concept";
            } else if (type.indexOf("skos") !== -1) {
                type = "https://schema.cassproject.org/0.4/skos/";
            }
            if (this.$store.state.lode.schemata[type] === undefined) {
                var augmentedType = type;
                augmentedType += (type.indexOf("schema.org") !== -1 ? ".jsonld" : "");
                EcRemote.getExpectingObject("", augmentedType, function(context) {
                    me.$store.commit('rawSchemata', {id: type, obj: context});
                    jsonld.expand(context, function(err, expanded) {
                        if (err == null) {
                            me.$store.commit('schemata', {id: type, obj: expanded});
                            if (after != null) after();
                        } else {
                            console.error(err);
                        }
                    });
                }, console.error);
            } else {
                if (after != null) after();
            }
        },
        // Add a piece of new data to a property. Invoked by child components, in order to add data (for reactivity reasons).
        add: function(property, value) {
            var me = this;
            new EcAsyncHelper().each(me.getAllTypes(value), function(type, callback) {
                me.loadSchema(callback, type);
            }, function() {
                if (!EcArray.isArray(me.thing[property])) {
                    me.thing[property] = [me.thing[property]];
                }
                me.thing[property].push(me.deserialize(value));
                me.expand();
            });
        },
        // Removes a piece of data from a property. Invoked by child components, in order to remove data (for reactivity reasons).
        remove: function(property, index) {
            this.thing[property].splice(index, 1);
            this.save();
            this.expand();
        },
        // Changes a piece of data. Invoked by child components, in order to change a piece of data to something else (for reactivity reasons).
        update: function(property, index, value) {
            if (index == null) {
                this.thing[property] = value;
            } else {
                this.thing[property][index] = value;
            }
            this.expand();
        },
        // Saves this thing to the location specified by its @id.
        save: function() {
            // TODO: If repo isn't defined, save to its @id location.
            var saver = this;
            while (saver.thing.id == null || saver.thing.id === undefined) {
                saver = saver.$parent.$parent;
                if (saver.thing == null) {
                    return "Could not save.";
                }
            }
            // When we save, we need to remove all the extreneous arrays that we added to support reactivity.
            repo.saveTo(this.stripEmptyArrays(saver.thing), console.log, console.error);
        },
        // Supports save() by removing reactify arrays.
        stripEmptyArrays(o) {
            // TODO: Investigate use of Vue.$set instead of reactification method.
            if (EcArray.isArray(o)) {
                if (o.length === 0) {
                    return null;
                }
                for (var i = 0; i < o.length; i++) {
                    o[i] = this.stripEmptyArrays(o[i]);
                    if (o[i] == null) {
                        o.splice(i--, 1);
                    }
                }
            } else if (EcObject.isObject(o)) {
                for (var key in o) {
                    var value = this.stripEmptyArrays(o[key]);
                    if (value == null) {
                        delete o[key];
                    }
                }
            }
            return o;
        },
        // Gets all the fully qualfied type names (qualified by the @context) of all the objects in this Thing.
        getAllTypes: function(o, context) {
            // TODO: Use canonical type identifiers from expandedThing, so that we don't rely on @context.
            var types = [];
            if (o != null && o.context != null) {
                context = o.context;
            }
            if (EcArray.isArray(o)) {
                for (var i = 0; i < o.length; i++) {
                    types = types.concat(this.getAllTypes(o[i], context));
                }
            } else if (EcObject.isObject(o)) {
                if (o.type != null) {
                    if (o.context == null) o.context = context;
                    types.push(o.context + (o.context.endsWith("/") ? "" : "/") + o.type);
                }
                if (o["@type"] != null) {
                    if (o["@context"] == null) o["@context"] = context;
                    types.push(o["@context"] + (o["@context"].endsWith("/") ? "" : "/") + o["@type"]);
                }
                for (var key in o) {
                    types = types.concat(this.getAllTypes(o[key], context));
                }
            }
            return types;
        },
        // Given a short thing property id, go get the fully qualified property id.
        getThingKeyFromExpandedKey: function(expandedKey) {
            if (expandedKey === "http://purl.org/dc/terms/type") {
                this.keyMap[expandedKey] = "dcterms:type";
                return "dcterms:type";
            }
            if (expandedKey === "http://schema.org/name") {
                this.keyMap[expandedKey] = "name";
                return "name";
            }
            if (expandedKey === "http://schema.org/description") {
                this.keyMap[expandedKey] = "description";
                return "description";
            }
            if (expandedKey === "broadens") {
                this.keyMap[expandedKey] = "Broadens";
                return "Broadens";
            }
            if (expandedKey.indexOf("@") === 0) {
                this.keyMap[expandedKey] = expandedKey.substring(1);
                return expandedKey.substring(1);
            }
            if (this.thing[expandedKey] !== undefined) {
                this.keyMap[expandedKey] = expandedKey;
                return expandedKey;
            }
            for (var key in this.specialProperties) {
                if (key.toLowerCase() === expandedKey) {
                    this.keyMap[expandedKey] = key;
                    return key;
                }
            }
            for (var key in this.thing) {
                if (key.indexOf(":") === -1) continue;

                var property = key.split(':');
                var ctx = this.thing.context;
                if (this.thing.context.indexOf("skos") !== -1) {
                    ctx = "https://schema.cassproject.org/0.4/skos/";
                }
                if (this.$store.state.lode.rawSchemata[ctx] === undefined) {
                    console.warn("Could not locate schema: " + ctx);
                }
                property = this.$store.state.lode.rawSchemata[ctx]["@context"][property[0]] + property[1];
                if (expandedKey === property) {
                    this.keyMap[expandedKey] = key;
                    return key;
                }
            }
            if (this.thing[expandedKey.split('/').pop()] !== undefined) {
                this.keyMap[expandedKey] = expandedKey.split('/').pop();
                return expandedKey.split('/').pop();
            }
            if (this.thing[expandedKey.split('#').pop()] !== undefined) {
                this.keyMap[expandedKey] = expandedKey.split('#').pop();
                return expandedKey.split('#').pop();
            }
            return null;
        },
        getKeyFromMap: function(key) {
            if (this.keyMap[key]) {
                return this.keyMap[key];
            } else {
                return this.getThingKeyFromExpandedKey(key);
            }
        },
        deleteObject: function() {
            var parent = this.$parent;
            while (parent.deleteObject == null) { parent = parent.$parent; }
            parent.deleteObject(this.thing);
            this.confirmDialog = false;
        },
        removeObject: function() {
            var parent = this.$parent;
            while (parent.removeObject == null) { parent = parent.$parent; }
            parent.removeObject(this.thing);
        },
        exportObject: function(type) {
            var parent = this.$parent;
            while (parent.exportObject == null) { parent = parent.$parent; }
            parent.exportObject(this.thing, type);
        }
    }
};
</script>