<template>
    <button
        v-if="clickToLoad"
        @click="load">
        Load {{ uri }}
    </button>
    <span
        v-else-if="expandedThing"
        :class="'e-Thing e-'+shortType">
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
        <span
            v-if="showAlways == true"
            class="icon expand is-small">
            <i
                class="fa fa-bars"
                aria-hidden="true"
                title="Expand"
                @click="showAlways = false;" /></span>
        <span
            v-if="showAlways == false && showPossible != true"
            class="icon compact is-small">
            <i
                class="fa fa-level-up-alt"
                aria-hidden="true"
                title="Collapse"
                @click="showAlways = true;" />
        </span>
        <span
            v-if="!showAlways && showPossible != true && canEdit"
            class="icon expand is-small">
            <i
                class="fa fa-bars"
                aria-hidden="true"
                title="Expand"
                @click="showPossible = true;" /></span>
        <span
            v-if="!showAlways && showPossible == true && canEdit"
            class="icon compact is-small">
            <i
                class="fa fa-level-up-alt"
                aria-hidden="true"
                title="Collapse"
                @click="showPossible = false;" />
        </span>
        <ul
            class="e-Thing-always-ul e-Thing-ul"
            v-if="showAlways == true && expandedThing != null && expandedThing !== undefined">
            <Property
                v-for="(value,key) in alwaysProperties"
                :key="thing[getThingKeyFromExpandedKey(key)]"
                :thing="thing"
                :expandedThing="expandedThing"
                :property="getThingKeyFromExpandedKey(key)"
                :expandedProperty="key"
                :schema="value"
                :canEdit="canEdit" />
        </ul>
        <ul
            class="e-Thing-possible-ul e-Thing-ul"
            v-else-if="showPossible == true && expandedThing != null && expandedThing !== undefined">
            <Property
                v-for="(value,key) in possibleProperties"
                :key="thing[getThingKeyFromExpandedKey(key)]"
                :thing="thing"
                :expandedThing="expandedThing"
                :property="getThingKeyFromExpandedKey(key)"
                :expandedProperty="key"
                :schema="value"
                :canEdit="canEdit" />
        </ul>
        <ul
            class="e-Thing-view-ul e-Thing-ul"
            v-else-if="expandedThing != null && expandedThing !== undefined">
            <Property
                v-for="(value,key) in viewProperties"
                :key="thing[getThingKeyFromExpandedKey(key)]"
                :thing="thing"
                :expandedThing="expandedThing"
                :property="getThingKeyFromExpandedKey(key)"
                :expandedProperty="key"
                :schema="value"
                :canEdit="canEdit"
                :profile="profile" />
        </ul>
    </span>
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
        expandedObj: Object,
        // (Optional) URI/URL to an object to go fetch, in lieu of the above two.
        uri: String,
        // If the uri is specified, whether we should delay loading. (prevents infinite loops)
        clickToLoad: Boolean,
        // True if the parent isn't editable, this shouldn't be either. Overrides canEdit.
        parentNotEditable: Boolean,
        // Application profile used to constrain and respecify properties that are to be made editable.
        profile: Object
    },
    components: {
        Property
    },
    data: function() {
        return {
            // After initialization, this will hold the thing we're displaying/CRUDing.
            thing: null,
            // After initialization and expansion, this will hold the fully expanded thing we're displaying/CRUDing.
            expandedThing: null,
            // True if we are in the compacted (alwaysProperties) property display mode. In the middle of this and showPossible is all properties that we can view.
            showAlways: true,
            // True if we are in the fully expanded (possibleProperties) property display mode. Only relevant if we can edit the object.
            showPossible: null,
            // The raw schema, uncomputed-over schema objects. Kept for internal processing reasons.
            rawSchema: null
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
            return this.thing.canEditAny(EcIdentityManager.ids);
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
            // TODO: Make this configurable.
            var result = {};
            var props = ["http://schema.org/name", "http://schema.org/description"];
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
                result[key] = this.$store.state.schemaFallback[key];
            }
            return result;
        },
        // Map of fully qualified property ids to schema items, unlimited, shown in the second level of breakout. Configurable via the profile property.
        possibleProperties: function() {
            var result = {};
            for (var key in this.viewProperties) { result[key] = this.viewProperties[key]; }
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
                result[key] = this.$store.state.schemaFallback[key];
            }
            return result;
        },
        // Attempt to get icons for types. Failed pretty miserably.
        iconClass: function() {
            return "fas fa-" + this.shortType.toLowerCase();
        }
    },
    methods: {
        // Initialization method.
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
                                me.rawSchema = me.$store.state.schemata[me.type];
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
                        me.rawSchema = me.$store.state.schemata[me.type];
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
                            me.rawSchema = me.$store.state.schemata[me.type];
                        });
                    });
                }
            }
        },
        // Fleshes out the Thing object with empty containers for any possible field that can be edited, according to the schema. Permits reactivity of currently unused fields.
        reactify: function(o) {
            var schema = null;
            if (o.type != null) {
                schema = this.$store.state.schemata[o.context + (o.context.endsWith("/") ? "" : "/") + o.type];
            }
            if (o["@type"] != null) {
                schema = this.$store.state.schemata[o["@context"] + (o["@context"].endsWith("/") ? "" : "/") + o["@type"]];
            }
            if (schema != null) {
                for (var i = 0; i < schema.length; i++) {
                    var key = schema[i]["@id"];
                    var shortKey = key.split("/").pop();
                    if (schema[i]["@type"] === undefined && schema[i]["http://schema.org/domainIncludes"] === undefined) continue;
                    if (schema[i]["@type"] != null && schema[i]["@type"][0].indexOf("Property") === -1) continue;
                    if (o[shortKey] == null) {
                        o[shortKey] = [];
                    } else if (!EcArray.isArray(o[shortKey])) {
                        o[shortKey] = [o[shortKey]];
                    }
                }
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
            }
            if (this.$store.state.schemata[type] === undefined) {
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
        remove: function(expandedProperty, index) {
            this.thing[expandedProperty.split("/").pop()].splice(index, 1);
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
                return "dcterms:type";
            }
            if (this.thing[expandedKey] !== undefined) {
                return expandedKey;
            }
            for (var key in this.thing) {
                if (key.indexOf(":") === -1) continue;

                var property = key.split(':');
                if (this.$store.state.rawSchemata[this.thing.context] === undefined) {
                    console.warn("Could not locate schema: " + this.thing.context);
                }
                property = this.$store.state.rawSchemata[this.thing.context]["@context"][property[0]] + property[1];
                if (expandedKey === property) {
                    return key;
                }
            }
            if (this.thing[expandedKey.split('/').pop()] !== undefined) {
                return expandedKey.split('/').pop();
            }
            return null;
        }
    }
};
</script>