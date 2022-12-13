---
title: Getting Sassy with @use and @forward
description: Sass is hoping to depreciate the @import syntax in the future, and I wanted to talk through my experience migrating to the new @use and @forward syntax in Mozilla's design system
date: Created
layout: post.njk
---
In October of 2021, the [Sass](https://www.sass-lang.com) team announced the [target drop date for the `@import` syntax depreciation](https://github.com/sass/sass/blob/main/accepted/module-system.md#timeline). In July, Sass said they will hold off on depreciating `@import` until 80% of users are using Dart Sass over Lib Sass. Something to note is that CSS imports are now availible and the maintainers of Sass were worried that it was cause confusion between the two.

While the `@import` is not being depreciated yet, the webistes team at Mozilla agreed that migrating to the new module system was the best way to future proof our design system, [Protocol](https://protocol.mozilla.org/).

The new module system changed the way that Sass works and how you think about it, but Sass [lists](https://sass-lang.com/blog/the-module-system-is-launched) some common problems with `@import`:
- **Global scope conflicts**:
    -  It was difficult to figure out where a given variable, mixin, or function (collectively called “members”) was originally defined, since anything defined in one stylesheet was available to all stylesheets that were imported after it.
    - members could also be unintentionally overwritten if they weren't carefully namespaced
- **Duplicate CSS**: Stylesheets could be re-loaded from scratch every time they were imported, which could cause some strange side-affects
- **No privacy**: Sass Library authors had no way to ensure that private helper functions wouldn't be accessed by users, which could cause confusion

### Whats the deal with `@use`?

`@use` attempts to solve the the issues with `@import` listed above. It makes styles, variables, mixins, and functions from another stylesheet accessible in the current stylesheet. By default the members are only available in a namespace based on the basename of the URL.

#### Biggest differences between `@use` and `@import`
- `@use` only executes a stylesheet and includes its CSS once, no matter how many times that stylesheet is used.
- `@use` only makes names available in the current stylesheet, as opposed to globally.
- Members whose names begin with - or _ are private to the current stylesheet with `@use`.
- If a stylesheet includes `@extend`, that extension is only applied to stylesheets it imports, not stylesheets that import it.

Here is a pretty simple example of `@use` in action:

```scss
@use "config";

.my-cool-element {
    @include config.$title-size;
    padding: config.spacing-xl;
}
```
So instead of calling the variables directly, you now will use the namespace of the import (in this case `config`). The default namespace is set by its url, you can also explicitly set the namespace using the `as` keyword:

```scss
@use "config" as 'tokens';

.my-cool-element {
    @include tokens.$title-size;
    padding: tokens.$spacing-xl;
}
```

You can also add the @use to the global namespace by doing this: `@use "config" as *` which would allow you to use a member without a specific namespace. `config.spacing-xl` -> just `spacing-xl`.

## Lets talk about @forward

Using @forward in a stylesheet will not be commonly used by most users of sass - it's meant for library authors to split up their libraries code among many different source files without needing everything to be in one local file. Unlike `@use` forward doesnt add any namespaces to what is forwarded.

```scss
@forward 'functions';
// you can add prefixes with the `as` keyword
@forward 'tokens' as 'token-*';


.hero {
    // this will causxe an error, since members in @forward are not availible in the stylesheet they are called in
    @include functions.hide-str()
}
```

We ended up using @forward pretty frequently in Protocol, but it was a learning curve when to use `@forward` vs. `@use`. Basically our rule was this: If using the imported members in that file use `@use`! Otherwise pass it `@forward`!

## Protocol's Structure and common pitfalls
Protocol uses the following folder structure (simplified for this post):

```markdown
├── protocol
│   ├── base
│   │   ├── `*.scss` (rules for basic elements, typography and layouts)
│   ├── components
│   │   ├── `*.scss` (rules for specific components)
│   ├── inlcudes
│   │   ├── _lib.scss
│   │   ├── _functions.scss
│   │   ├── _mixins.scss
│   │   ├── _tokens.scss
│   │   ├── _themes.scss
│   ├── protocol-components.scss
└── ├── protocol.scss
```

### Some things to note

The `_lib.scss` file imports the functions, mixins, tokens, and themes and `@forwards` them to make them availible to any file that uses any of those members (which is also used by users of Protocol, not just library maintainers).

### Sass Error: This moduile was already loaded so it cannot be configured using 'with'
This popped up a lot, but was fairly easy to fix. Basically, each sass module is loaded once in the @use/@forward syetem. On the initial load you can configure it using the `with` keyword. More info on configuring a file can be found [here](https://sass-lang.com/documentation/at-rules/use#configuration).

Our team needed to take a closer look at the imports and why we were configuring them in different ways. For us, it was necessary to break up what was included in `lib.scss` into much smaller parts.

### Sass Error: Two forwarded modules both define the same variable:
When you import a stylesheet with `@forward`, you are adding all of the forwarded members in the same namespace, so if two forwarded files have a variable with the same name, it will throw this error.

The best way to fix this would be to either make one of the variables private, prefix the fowarded file or using the `hide` keyword.
```scss
@forward 'variables' hide spacing-lg;
or
@forward 'variables' as variables-*;
```

### Sass Error Module-loop: this module is already being loaded.
This is the WORST ONE. During migration this came up a lot! In essence, Sass is attempting to load a stylesheet (from `@use`) in your current stylesheet, but the loaded stylesheet also imports your current stylesheet. TIME PARADOX!

To solve these errors, we had to restructure a lot of protocol, but mainly inside of the `includes` folder. Previously, the `lib.scss` file imported all of the other files in that folder. If the `functions.scss` file needed one of the mixins or a variable, you would import `lib.scss` since it contained all of those members. Makes sense? With `@use`, doing things in the same way would produce a TON of errors.

To fix this - `functions.scss` would only `@use` from it's sibling files: mixins, functions, etc, but not any upstream files where functions was being imported into.

### Sass' migration tool
Sass also created a [migration tool](https://sass-lang.com/documentation/cli/migrator) for this very purpose, and it actually works quite well. It will automatically update your sass files that use `@import` syntax to the latest sass module syntax. We used the migration tool at the beginning of this project (which was really helpful to see how it works!), but since we encountered so many of the module-loop errors, a lot of it needed to be fixed by hand. For smaller libraries or web applications, the migration tool would be hugely helpful.

Special thanks to Maureen Holland



