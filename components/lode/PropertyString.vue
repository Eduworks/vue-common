<template>
    <div class="input-field">
        <span
            v-if="range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime'"
            class="input-span">
            <input
                v-model="computedText"
                type="datetime-local"
                @blur="blur">
        </span>
        <span
            v-else-if="options">
            <select
                v-model="computedText"
                @blur="blur">
                <option
                    v-for="item in options"
                    :key="item"
                    :value="item.val">{{ item.display }}</option>
            </select>
        </span>
        <div
            v-else>
            <input
                ref="language"
                class="text-input"
                v-if="computedLanguage || langString"
                v-model="search"
                @input="onSearchChange"
                @blur="blur">
            <div>
                <ul v-show="isOpen">
                    <li
                        v-for="(result, i) in filtered"
                        :key="i"
                        @mousedown="setLanguage(result)">
                        {{ result.display }}
                    </li>
                </ul>
            </div>
            <textarea
                ref="textarea"
                class="textarea-input"
                rows="1"
                v-model="computedText"
                @blur="blur" />
        </div>
    </div>
</template>

<script>
const languagesFile = require('../../ietf-language-tags_json.json');
export default {
    name: 'PropertyString',
    props: {
        expandedThing: Object,
        expandedProperty: String,
        schema: Object,
        index: null,
        langString: null,
        range: null,
        options: null
    },
    created: function() {
    },
    data: function() {
        var property = this.expandedThing[this.expandedProperty];
        if (EcArray.isArray(property)) {
            return {
                text: this.expandedThing[this.expandedProperty][this.index],
                indexInternal: this.index,
                isOpen: false,
                search: "",
                languages: [],
                filtered: []
            };
        } else {
            return {
                text: this.expandedThing[this.expandedProperty],
                indexInternal: null,
                isOpen: false,
                search: "",
                languages: [],
                filtered: []
            };
        }
    },
    mounted: function() {
        this.search = this.computedLanguage;
        if (this.computedLanguage || this.langString) {
            for (var i = 0; i < languagesFile.length; i++) {
                var tag = {};
                tag.tag = languagesFile[i].subtag;
                tag.display = languagesFile[i].description;
                this.languages.push(tag);
            }
        }
    },
    computed: {
        computedText: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] === undefined) {
                        return null;
                    }
                    if (this.range[0] === 'http://www.w3.org/2001/XMLSchema#dateTime' && this.text["@value"].length > 16) {
                        return this.text["@value"].substr(0, 16);
                    }
                    return this.text["@value"];
                }
                return this.text;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@value"] !== undefined) {
                        this.text["@value"] = value;
                    }
                } else {
                    this.text = value;
                }
            }
        },
        computedLanguage: {
            get: function() {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] === undefined) {
                        return null;
                    }
                    return this.text["@language"];
                }
                return null;
            },
            set: function(value) {
                if (EcObject.isObject(this.text)) {
                    if (this.text["@language"] !== undefined) {
                        this.text["@language"] = value;
                    }
                }
            }
        }
    },
    watch: {
        text: function(newValue, oldValue) {
        }
    },
    methods: {
        blur: function() {
            this.$parent.update(this.text, this.indexInternal);
            this.isOpen = false;
        },
        onSearchChange: function() {
            if (this.search.length >= 2) {
                this.isOpen = true;
                this.filterResults();
            }
        },
        filterResults: function() {
            this.filtered = this.languages.filter(item => item.display.toLowerCase().indexOf(this.search.toLowerCase()) !== -1);
        },
        setLanguage: function(language) {
            this.computedLanguage = language.tag;
            this.search = language.display;
            this.isOpen = false;
            this.blur();
        }
    }
};
</script>