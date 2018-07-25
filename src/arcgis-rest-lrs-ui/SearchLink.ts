import registry from "dijit/registry";
import Search from "esri/dijit/Search";

type SearchName = string | RegExp;

/**
 * Thrown when an invalid name is selected as a source for a Search control.
 */
export class NoMatchingSourceError extends Error {
  constructor(
    /** The search control. */
    public readonly search: Search,
    /** The name of the search source. */
    public readonly searchName: SearchName
  ) {
    super(`No source found in Search widget with name matching ${searchName}.`);
  }
}

/**
 * Gets the index of the first search source with a name matching a RegExp.
 * @param search Search control
 * @param searchName Search name string or a regular expression for matching the name.
 * @returns Returns an integer number if there was a single matching source.
 * Returns an array of numbers if there was more than one match.
 * Returns null if there were no matches.
 */
function getSearchIndex(search: Search, searchName: SearchName = /County/i) {
  const { sources } = search;
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (
      (searchName instanceof RegExp && searchName.test(source.name)) ||
      searchName === source.name
    ) {
      return i;
    }
  }
  return null;
}

/**
 * Selects a search source.
 * @param search Search control
 * @param searchName Search name string or a regular expression for matching the name.
 * @throws {NoMatchingSourceError}
 */
function selectSearchSource(
  search: Search,
  searchName: SearchName = /County/i
) {
  const i = getSearchIndex(search, searchName);
  if (i == null) {
    throw new NoMatchingSourceError(search, searchName);
  }
  search.set("activeSourceIndex", i);
}

/**
 * An anchor that when clicked will focus on the search control
 * and select the specified
 * @param search A Search widget.
 * @param searchName Search name string or a regular expression for matching the name.
 */
export function createSearchLink(searchName?: SearchName) {
  const a = document.createElement("a");
  a.textContent =
    "Zoom to a county via the Search box to make CRAB routes visible";
  a.href = "#";
  a.onclick = () => {
    const search = registry.byId<Search>("search");
    try {
      if (searchName) {
        selectSearchSource(search, searchName);
        search.clear();
        // Open the search source selection menu on the search widget.
        const searchButton = document.getElementById("search_menu_button");
        if (searchButton) {
          searchButton.click();
        }
      }
      search.focus();
    } catch (error) {
      if (error instanceof NoMatchingSourceError) {
        alert(error.message);
      } else {
        // tslint:disable-next-line:no-console
        console.error(error.message, error);
      }
    }
    return false;
  };
  return a;
}
