import {CheckField, Options, VariableType, ERRORS_TYPES, CheckWithError} from "./declarations/types";
import moment from "moment";

let NumberAllowedOptions:   string[] = ['newPropertyName', 'min', 'max', 'round'];
let StringAllowedOptions:   string[] = ['newPropertyName', 'minLength', 'maxLength', 'hasUpperCase', 'hasLowerCase'];
let BoolAllowedOptions:     string[] = ['newPropertyName', 'convertToNumber'];
let FileAllowedOptions:     string[] = ['newPropertyName', 'allowedExtensions', 'minimumSize', 'maximumSize'];
let DateAllowedOptions:     string[] = ['newPropertyName', 'convertToDateFormat'];
let JsonAllowedOptions:     string[] = ['newPropertyName', 'allowedProps'];

class Field {
    private readonly _name: string;
    private readonly _value: any;
    private readonly _variableType: VariableType;
    private readonly _optional: boolean;

    private readonly _options?: Options;

    get name(): string {
        return this._name;
    }

    get options(): Options | undefined {
        return this._options;
    }

    constructor(
        name: string,
        value: any,
        variableType: VariableType,
        optional: boolean,
        options?: Options
    ) {
        this._name = name;
        this._value = value;
        this._variableType = variableType;
        this._optional = optional;

        if (options && Object.keys(options).length > 0) {
            this._options = options;

            switch (this._variableType) {
                case "stringArr":
                case "string":
                    for (let prop of Object.keys(this._options)) {
                        if (StringAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for string types, list of allowed values is: ${StringAllowedOptions.join(', ')}`);
                    }

                    break;
                case "numArr":
                case "num":
                    for (let prop of Object.keys(this._options)) {
                        if (NumberAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for number types, list of allowed values is: ${NumberAllowedOptions.join(', ')}`);
                    }

                    break;
                case "boolArr":
                case "bool":
                    for (let prop of Object.keys(this._options)) {
                        if (BoolAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for bool types, list of allowed values is: ${BoolAllowedOptions.join(', ')}`);
                    }

                    break;
                case 'fileArr':
                case "file":
                    for (let prop of Object.keys(this._options)) {
                        if (FileAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for file types, list of allowed values is: ${FileAllowedOptions.join(', ')}`);
                    }

                    break;
                case "dateArr":
                case "date":
                    for (let prop of Object.keys(this._options)) {
                        if (DateAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for date types, list of allowed values is: ${DateAllowedOptions.join(', ')}`);
                    }

                    break;
                case "JSON":
                    for (let prop of Object.keys(this._options)) {
                        if (JsonAllowedOptions.indexOf(prop) === -1) throw Error(`Option ${prop} not allowed for JSON type, list of allowed values is: ${JsonAllowedOptions.join(', ')}`);
                    }

                    break;
            }
        }
    }

    private formattedObj(value: any): { [key: string]: any } {
        let obj: { [key: string]: any } = {};

        if (this.options && this.options.newPropertyName !== undefined) {
            if (this.options.newPropertyName !== null) obj = {[this.options.newPropertyName]: value};
        } else {
            obj = {[this.name]: value};
        }

        return obj;
    }

    private parseArr(): Array<any> {
        let values: Array<any>;

        if (Array.isArray(this._value)) {
            values = this._value;
        } else {
            values = this._value.split(',');
        }

        return values;
    }

    private static errorObj(name: string, type: ERRORS_TYPES, value?: any): CheckWithError {
        return {
            value: value ? value : null,
            field: name,
            error: type
        }
    }

    private checkDate(value: any): CheckField {
        let errors: CheckWithError[] = [];

        let parsedDate = Date.parse(value);

        if (isNaN(parsedDate)) errors.push(Field.errorObj(this.name, "TYPE", value));

        if (errors.length > 0) return [null, errors];

        if (this.options) {
            let options: Options = this.options;

            if (options.convertToDateFormat) {
                switch (this.options.convertToDateFormat) {
                    case "milliseconds":
                        value = Date.parse(value);
                        break;
                    case "YYYY-MM-DD":
                    case "YYYY-MM-DD HH:mm:ss":
                        value = moment(value).format(this.options.convertToDateFormat);
                        break;
                }
            }
        }

        return [value, errors];
    }

    private checkString(value: any): CheckField {
        let errors: CheckWithError[] = [];

        if (typeof value !== 'string') errors.push(Field.errorObj(this.name, "TYPE", value));

        if (errors.length > 0) return [null, errors];

        if (this.options) {
            let options: Options = this.options;

            if (options.minLength) {
                if (options.minLength > value.length) {
                    errors.push(Field.errorObj(this.name, "STRING_TOO_SHORT", value));
                }
            }

            if (options.maxLength) {
                if (options.maxLength < value.length) {
                    errors.push(Field.errorObj(this.name, "STRING_TOO_LONG", value));
                }
            }

            if (options.hasUpperCase !== undefined) {
                if (options.hasUpperCase !== this.checkIfStrHasUpperCase()) {
                    if (options.hasUpperCase) errors.push(Field.errorObj(this.name, "STRING_DONT_HAVE_UPPER_CASE", value));
                    else errors.push(Field.errorObj(this.name, "STRING_HAS_UPPER_CASE", value));
                }
            }

            if (options.hasLowerCase !== undefined) {
                if (options.hasLowerCase !== this.checkIfStrHasLowerCase()) {
                    if (options.hasLowerCase) errors.push(Field.errorObj(this.name, "STRING_DONT_HAVE_LOWER_CASE", value));
                    else errors.push(Field.errorObj(this.name, "STRING_HAS_LOWER_CASE", value));
                }
            }
        }

        if (errors.length > 0) return [null, errors];

        return [value, errors];
    }

    private checkNumber(value: any): CheckField {
        let errors: CheckWithError[] = [];

        if (isNaN(value)) errors.push(Field.errorObj(this.name, "TYPE", value))

        if (errors.length > 0) return [null, errors];

        if (this.options) {
            let options: Options = this.options;

            if (options.min && value < options.min) {
                errors.push(Field.errorObj(this.name, "NUMBER_TOO_SMALL", value));
            }

            if (options.max && value > options.max) {
                errors.push(Field.errorObj(this.name, "NUMBER_TOO_LARGE", value));
            }
        }

        if (errors.length > 0) return [value, errors];

        return [value, errors];
    }

    private checkFile(): CheckField {
        return [null, []];
    }

    private checkBool(): CheckField {
        return [null, []];
    }

    private checkJSON(): CheckField {
        return [null, []];
    }

    private checkAllowedValues(): CheckField {
        return [null, []];
    }

    private checkIfStrHasUpperCase(): boolean {
        for (let el of this._value) {
            if (el === el.toUpperCase()) return true;
        }

        return false;
    }

    private checkIfStrHasLowerCase(): boolean {
        for (let el of this._value) {
            if (el === el.toLowerCase()) return true;
        }

        return false;
    }

    public check(): CheckField {
        if ((this._value === undefined || this._value === null) && !this._optional) {
            return [
                {},
                [Field.errorObj(this._name, "REQUIRED")]
            ];
        }

        if (this._value === null || this._value === undefined) return [{}, []];

        let errors: CheckWithError[] = [];
        let obj: { [key: string]: any } = {};

        let value: any;

        switch (this._variableType) {
            case "date":
                [value, errors] = this.checkDate(this._value);

                break;
            case "dateArr":
                let values = this.parseArr();

                value = [];

                for (let el of values) {
                    let [checkedEl, checkedErrors] = this.checkDate(el);

                    if (checkedEl) {
                        value.push(checkedEl);
                    }

                    errors.push(...checkedErrors);
                }

                break;
            case "string":
            case "stringArr":
                [value, errors] = this.checkString(this._value);

                if (value) obj = this.formattedObj(value);

                break;
            case "num":
            case "numArr":
                [value, errors] = this.checkNumber(this._value);

                if (value) obj = this.formattedObj(value);

                break;
            case "bool":
            case "boolArr":
                return this.checkBool();
            case "file":
            case "fileArr":
                return this.checkFile();
            case "JSON":
                return this.checkJSON();
            case "allowedValues":
            case "allowedValuesArr":
                return this.checkAllowedValues();
        }

        if ((value && !Array.isArray(value)) || (value && Array.isArray(value) && value.length !== 0)) {
            obj = this.formattedObj(value);
        }

        return [obj, errors];
    }
}

export default Field;