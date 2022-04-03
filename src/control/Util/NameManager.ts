export default class NameManager {
    public static cleanName(name: string): string {
        name = name.replace(/[^a-z0-9_ ]/ig, "");
        name = name.replace(/^\s*/i, "");
        name = name.replace(/\s*$/i, "");
        return name;
    }
}