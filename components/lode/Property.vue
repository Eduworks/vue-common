<template>
    <li
        v-if="thing"
        :class="'e-Property e-' + shortType">
        <label
            :title="comment"
            @click="show = !show">
            <i
                v-if="comment"
                :title="comment"
                class="fa fa-info-circle"
                aria-hidden="true" /> {{ displayLabel }}:</label>
        <span
            v-if="edit != true && canEdit"
            class="icon edit is-small"
            title="Edit">
            <i
                class="fa fa-pencil-alt"
                aria-hidden="true"
                @click="edit = true;" /></span>
        <span
            v-else-if="canEdit"
            class="icon save is-small"
            title="Save">
            <i
                class="fa fa-save"
                aria-hidden="true"
                @click="edit = false;save();" /></span>
        <span v-if="edit == true">
            <button
                v-if="range.length == 0"
                class="add"
                title="Add New Text">
                <i
                    class="fa fa-plus"
                    aria-hidden="true"
                    @click="add('string')" />
                <span
                    @click="add('string')">
                    Text
                </span>
            </button>
            <button
                v-for="(targetType) in range"
                :key="targetType"
                class="add"
                :title="'Add New '+targetType.split('/').pop()">
                <i
                    class="fa fa-plus"
                    aria-hidden="true"
                    @click="add(targetType)" />
                <span
                    @click="add(targetType)">
                    {{ targetType.split("/").pop() }}
                </span>
            </button>
        </span>
        <ul
            class="e-Property-ul"
            v-if="value && show">
            <li
                v-for="(item,index) in expandedValue"
                :key="item">
                <span
                    v-if="edit == true"
                    class="icon remove is-small">
                    <i
                        class="fa fa-times"
                        aria-hidden="true"
                        @click="remove(index)" />
                </span>
                <Thing
                    v-if="!edit && isLink(item)"
                    :uri="item['@id']"
                    clickToLoad="true"
                    :parentNotEditable="!canEdit"
                    :profile="profile" />
                <Thing
                    :obj="value[index]"
                    :expandedObj="item"
                    v-else-if="!isText(item)"
                    :parentNotEditable="!canEdit"
                    :profile="profile" />
                <span v-else-if="edit">
                    <PropertyString
                        :index="index"
                        :property="property"
                        :thing="thing"
                        :value="item"
                        :profile="profile" />
                </span>
                <span
                    class="e-Property-text"
                    v-else-if="isObject(expandedValue[index])"> {{ expandedValue[index]["@value"] }} </span>
                <span
                    class="e-Property-text"
                    v-else> {{ expandedValue[index] }} </span>
            </li>
        </ul>
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
        profile: Object
    },
    data: function() {
        return {
            // True if we are in edit mode.
            edit: null,
            // True if we should be showing ourself.
            show: true
        };
    },
    components: {
        // Circular references require this trick.
        Thing: () => import('./Thing.vue'),
        // Property editing box for String type things. Should be one of these for each value type.
        PropertyString: PropertyString
    },
    created: function() {
    },
    computed: {
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
            return this.type.split("/").pop();
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
        // The current value(s) of the property. Takes care of prefix:propertyName type shananagans.
        value: {
            get: function() {
                var result = this.thing[this.property];
                if (result != null) return result;
                if (this.expandedValue != null) {
                    result = this.thing[this.expandedProperty];
                }
                if (result != null) return result;
                if (this.property.indexOf(":") !== -1) {
                    var property = this.property.split(':');
                    property = this.$store.state.rawSchemata[this.thing.context]["@context"][property[0]] + property[1];
                    result = this.thing[property];
                }
                return result;
            }
        },
        // The current value(s) of the property based on the expanded thing.
        expandedValue: {
            get: function() {
                return this.expandedThing[this.expandedProperty];
            }
        }
    },
    methods: {
        add: function(type) {
            if (type.toLowerCase().indexOf("string") !== -1 || type.toLowerCase().indexOf("url") !== -1) {
                this.$parent.add(this.property, "");
            } else {
                var rld = new EcRemoteLinkedData();
                rld.context = this.context;
                rld.type = type.split("/").pop();
                this.$parent.add(this.property, rld);
            }
        },
        remove: function(index) {
            this.$parent.remove(this.expandedProperty, index);
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
                if (type["@id"] != null && type["@id"] !== undefined) { return true; }
            }
            return false;
        },
        save: function() {
            this.$parent.save();
        },
        isObject: function(k) { return EcObject.isObject(k); }
    }
};
</script>
