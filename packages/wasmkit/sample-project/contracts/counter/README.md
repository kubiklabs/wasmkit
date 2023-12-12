# Counter contract

Counter contract is created with a parameter for the initial count and allows subsequent incrementing.

## Contract Functions
- `Increment`: Any user can increment the current count by 1.
- `Reset`: Only the owner can reset the count to a specific number.
- `getCount`: Any user can use this function to see current counter value.

## Messages

### InitMsg

```rust
pub struct InstantiateMsg {
    pub count: i32,
}
```

### ExecuteMsg

```rust
pub enum ExecuteMsg {
    Increment {},
    Reset { count: i32 },
}
```

### QueryMsg

```rust
pub enum QueryMsg {
    // responds with CountResponse
    GetCount {},
}

pub struct CountResponse {
    pub count: i32,
}
```

## Storage

### Constants

```rust
pub struct Constants {
    pub count: i32,
    pub owner: String
}
```
