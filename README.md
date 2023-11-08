# Dynamodels

[![npm](https://img.shields.io/npm/v/dynamodels)](https://www.npmjs.com/package/dynamodels)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/dynamodels)](https://bundlephobia.com/package/dynamodels)
![npm](https://img.shields.io/npm/dm/dynamodels)
[![semantic-release](https://img.shields.io/badge/semantic--release-enabled?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/neoxia/dynamodels/publish.yml?branch=main)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=coverage)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=security_rating)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=sqale_index)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=bugs)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=neoxia_dynamodels&metric=code_smells)](https://sonarcloud.io/dashboard?id=neoxia_dynamodels)

![Logo](https://raw.githubusercontent.com/neoxia/dynamodels/master/logo.svg?sanitize=true)

Dynamodels is a dead simple typescript overlay to easily manage DynamoDB CRUD operations.

It provides helpers for pagination, filtering, sorting and more !

## Installation

Install `dynamodels` package from NPM public registry.

- Using npm: `npm i dynamodels`

- Using yarn: `yarn add dynamodels`

## Getting started

The only thing you need to do is extending base model class `Model<T>` providing a type defintion for your entity, a table name, a hashkey, and optionally, a range key.

Here is an example for table with a composite key:

```typescript
// Import dynamodels Base Model
import Model from 'dynamodels';

// Type definition for your entity
interface IAlbum {
  artist: string;
  album: string;
  year?: number;
  genres?: string[];
}

export class Album extends Model<IAlbum> {
  // DynamoDB table name
  protected tableName = 'my_albums';
  // The keys of the table. Here it is a composite key (artist,album)
  protected hashkey = 'artist';
  protected rangekey = 'album';

  // Optionally override constructor
  constructor(item?: IAlbum) {
    super(item);
  }
}
```

Here is another example for a table with a simple hashkey:

```typescript
import Model from 'dynamodels';

interface IUser {
  email: string;
  // ..other fields
}

export class User extends Model<IUser> {
  protected tableName = 'my_users';
  protected hashkey = 'email';
}
```

## Create an entity

You can either call the create method or the save method.

The create method will throw if the hashkey or the hashkey/rangekey pair already exists.

The save method will overwrite the existing item.

```typescript
const classic = new Album({
  artist: 'Pink Floyd',
  album: 'Dark Side of the Moon',
  year: 1973,
  genre: ['Rock', 'Psychadelic', 'Progressive'],
});

// Item will be saved
await album.save();

// Will throw, as item already exists
try {
  await album.create();
} catch (e) {
  if (e.name === 'EALREADYEXISTS') {
    // Do something
  }
  // Do something else
}
```

You can also directly pass in argument the item to save.

```typescript
const albums = new Album();

await album.create({
  artist: 'Bob Marley & The Wailers',
  album: "Burnin'",
  year: 1973,
  genre: ['Reggea'],
});
```

### Model validation

You can use Joi objects to validate the data to save.

If object don't pass Joi validation an error is thrown.

Define your Joi schema in your model.

```typescript
export class Album extends Model<IAlbum> {
  protected tableName = 'my_albums';
  protected hashkey = 'artist';
  protected rangekey = 'album';

  protected schema = Joi.object().keys({
    artist: Joi.string().required(),
    album: Joi.string().required(),
    year: Joi.number().required(),
    genres: Joi.array(Joi.string()).optional(),
  });
}
```

Model validation is automatically enforced when creating/saving entities:

```typescript
// Will throw as year must be a number
await album.save({
  artist: 'Bob Marley & The Wailers',
  album: "Burnin'",
  year: '1973',
  genre: ['Reggea'],
});
```

## Get an item

Table has a simple hashkey:

```typescript
const users = new User();
const user = await user.get('some-user@domain.com'); // {email: some-user@domain.com, ...}
```

Table has a composite key:

```typescript
const albums = new Album();
const nvrmind = await album.get('Nirvana', 'Nevermind'); // {artist: 'Nirvana', album: 'Nevermind', year: 1991...}
```

_Note:_ For table with a composite key, range key is mandatory. This will throw an exception.

```typescript
await album.get('ACDC'); // Bad Request
```

You can also just check if an item exists:

```typescript
const albums = new Album();
if (await album.exists('The Fugees', 'The Score')) {
  return 'Kill me softly';
}
```

## Scan table

_Note_: It is not advised to use scan operations as it is time-consuming.

To retrieve all the entries of a table use a DynamoDB scan operation.

```typescript
const albums = new Album();
const result = await albums.scan().exec();
```

This will return the first 1MB of matching result and the last evaluated key.

If you want to retrieve all items beyond this 1MB limit, use `execAll`;

```typescript
const result = await albums.scan().execAll();
```

### Paginate

You can use pagination helpers to get paginated result

```typescript
const albums = new Album();
const result = await albums.scan().paginate({ size: 50 }).exec();
```

This will return the 50 first items and the last evaluated key. To fetch the next page, simply use:

```typescript
const nextPage = await albums.scan().paginate(result.nextPage)exec();
```

### Pagination mode

Natively, dynamoDB performs filter operations after having retrieved a page of result.

This leads to inconsistent pages size. Let's say you target a page size of 50. DynamoDB fetch the first page which length is 50. After applying filters on this first page you ends up with 13 results, and maybe 32 on the seconds, 7 on the third and so on.

If you want to force page size to be same despite filtering, you can use `PaginationMode.CONSTANT_PAGE_SIZE` option.

```typescript
const albums = new Album();
const result = await albums
  .scan()
  .filter({
    year: 1969, // Summer of love
  })
  .paginate({
    mode: PaginationMode.CONSTANT_PAGE_SIZE,
    size: 50,
  })
  .exec();
```

Under the hood, dynamodels will fetch as many pages as it is necessary to fill the 50 results matching filters.

### Filtering scan operations

A filtering helper method is also available.

For instance to retrieve albums released after 1973 (included), use the following query:

```typescript
const albums = new Album();
const result = await albums
  .scan()
  .filter({
    year: ge(1973),
  })
  .exec();
```

The `filter` accept an object where keys are the fields on which you to filter and value can be either:

1. just the target value of the field, in this case the equal `EQ` operator is used
2. a call to a filter operator helper method.

_Note_: if you want to filter on a field which is also a [Amazon reserved keyword](https://docs.aws.amazon.com/fr_fr/amazondynamodb/latest/developerguide/ReservedWords.html), dynamodels with automatically escape it :sparkles:

### Filter operators

Available filter operators are:

1. Equal: `eq(value: string | number | Buffer)`
2. Not Equal: `neq(value: string | number | Buffer)`
3. In: `isIn(values: Array<string | number | Buffer>)`
4. Lesser than: `lt(value: string | number | Buffer)`
5. Lesser or equal than: `le(value: string | number | Buffer)`
6. Greater than: `gt(value: string | number | Buffer)`
7. Greater or equal than: `le(value: string | number | Buffer)`
8. Between boundaries: `between(lower: string | number | Buffer, upper: string | number | Buffer)`
9. Contains substring `contains(value: string)`
10. Do not contains substring: `notContains(value: string)`
11. Begin with: `contains(value: string)`
12. Is null: `isNull()`
13. Is not null: `notNull()`

For string, utf-8 alphabetical order is used.

For binary, unsigned byte-wise comparison is used.

Check official DynamoDB documentation for more details.

### Filter Condition Builder

For complex conditions, i.e. conditions with compositions of AND/OR or NOT clauses, dynamodels provides a fluid synthax to easily write them.

```typescript
const albums = new Album();
const result = await albums
  .scan()
  .filter(attr('year').lt(1970)
    .or(attr('year').ge(1980))
    .and(not(attr('artist').beginsWith('Bob')))
  .exec();
```

## Query items

The library also provides helpers to build dynamoDB queries.

The synthax is simmilar to `scan` operations.

### Key conditions

Key conditions can be added with the `keys` helpers method.

For instance to retrieve all the album for a given artist.

```typescript
const albums = new Album();
const result = await albums
  .query()
  .filter({
    artist: 'The Rolling Stones',
  })
  .exec();
```

You can combine key condition if your table has a composite key.

In this case both condition are applied: it is a `AND` not a `OR`.

### Key condition operators

Available key conditions operators are:

1. Equal: `eq(value: string | number | Buffer)`
2. Lesser than: `lt(value: string | number | Buffer)`
3. Lesser or equal than: `le(value: string | number | Buffer)`
4. Greater than: `gt(value: string | number | Buffer)`
5. Greater or equal than: `le(value: string | number | Buffer)`
6. Between boundaries: `between(lower: string | number | Buffer, upper: string | number | Buffer)`
7. Begin with: `contains(value: string)`

### Key condition builder

You can use, if you prefer, the same fluid sythax than for filter conditions.

```typescript
const albums = new Album();
const result = await albums.query().keys(attr('artist').eq('Bob Dylan')).exec();
```

Just be aware that:

1. Key condition on hash key is mandatory.
2. Only `eq()` operator can be used on hash key.
3. You can only use `and` between hash key condition and optional range key condition.
4. Only the operators listed above can be used on range key condition.

Otherwise dynamoDB will throw a ValidationException. Dynamodels will not check these prerequisites for you.

### Using indexes

You can also specify the index which is used.

Let's say you have the following global secondary index called `year_index` on your albums table: `pk=artist, sk=year`.

You can retrieve all the albums from Deep Purple release before 1976:

```typescript
const albums = new Album();
const result = await albums
  .query('year_index')
  .keys({
    artist: 'Deep Purple',
    year: lt(1976),
  })
  .exec();
```

The following synthax using index method is equivalent:

```typescript
const albums = new Album();
const result = await albums
  .query()
  .index('year_index')
  .filter({
    artist: 'Deep Purple',
    year: lt(1976),
  })
  .exec();
```

### Paginate

Pagination work the same way than for scan operations.

```typescript
const albums = new Album();
const result = await albums.query().keys({ artist: 'Dire Straits' }).paginate({ size: 50 }).exec();
```

This will return the 50 first items and the last evaluated key. To fetch the next page, simply use:

```typescript
const nextPage = albums.query().keys({ artist: 'Dire Straits' }).paginate(result.nextPage)exec();
```

### Filtering

Filtering process is the same for query and scan operations. [See above](filtering-scan-operations).

### Sorting

You can use `sort` helpers to sort the result based on the range key.

```typescript
const albums = new Album();

// From oldest to newest
const result = await albums
  .query('year_index')
  .filter({
    artist: 'James brown',
  })
  .sort('asc')
  .exec();

// From newest to oldest
const result = await albums
  .query('year_index')
  .filter({
    artist: 'James brown',
  })
  .sort('desc')
  .exec();
```

## Batch get

To perform a batch get operations, simply give the keys in argument:

```typescript
const albums = new Album();
const result = await albums.batchGet([
  { artist: 'Janis Joplin', album: "I Got Dem Ol' Kozmic Blues Again Mama!" },
  { artist: 'Creedence Clearwater Revival', album: 'Willy and the Poor Boys' },
  { artist: 'The Beatles', album: "Sgt. Pepper's Lonely Hearts Club Band" },
  { artist: 'Queen', album: 'A Night at the Opera' },
  { artist: 'The Clash', album: ' London Calling' },
]);
```

Batch get operations are limited to 100 items.

Under the hood, if you give more than 100 keys or keys pair, dynamodels will split the operation in chunks of 100 items.

For instance a batchGet operation with 642 keys will be automatically split in 7 batches.

## Update

A wrapper around `putItem` operations is provided.

The synthax is the following:

If table has a simple hashkey:

```typescript
const users = new User();
await user.update('some-user@domain.com', {
  password: put(hashSync('n3wP4ssW0rd', 10)),
  additional_details: remove(),
});
```

Table has a composite key:

```typescript
const albums = new Album();
await album.update('Jimi Hendrix', 'Are You Experienced', {
  year: add(1967),
  genre: put(['Rock', 'Blues', 'Psychadelic']),
});
```

The three helpers method, `add`, `remove`, and `put`provide convenient synthax to easily build `DoumentClient.UpdateAttributes` objects.

## Delete

Table has a simple hashkey:

```typescript
const users = new User();
await user.delete('some-user@domain.com');
```

Table has a composite key:

```typescript
const albums = new Album();
await album.delete('Nirvana', 'Nevermind');
```
