import { SearchEngine } from 'clientside-search'
import en from 'clientside-search/en'

export default class Bm25StudentSearch {
    constructor() {
        this.searchEngine = new SearchEngine(en)
    }
}