/**
 * The query behind the "All our books" link list. Its own key, NOT the ["public-comics", filters] one the card
 * grids use: seeding the grids' key from the server would put cards in the first HTML, and the cards depend on
 * the visitor's country (a browser-only store), so they must keep loading in the browser as before.
 */
export const ALL_BOOKS_QUERY_KEY = ["public-comics-all-books"];
