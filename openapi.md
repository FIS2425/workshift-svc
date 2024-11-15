# Workshifts Service

> Version 1.0.0

Workshift management for a personnel administration application. This microservice handles the scheduling, assignment, and modification of employee work shifts, including last-minute adjustments and cancellations.


## Path Table

| Method | Path | Description |
| --- | --- | --- |
| GET | [/workshifts](#getworkshifts) | Get all workshifts |
| POST | [/workshifts](#postworkshifts) | Create a new workshift |
| GET | [/workshifts/doctor/{doctorId}](#getworkshiftsdoctordoctorid) | Get workshifts by doctor ID |
| POST | [/workshifts/week](#postworkshiftsweek) | Create a new workshift for a week |
| DELETE | [/workshifts/{id}](#deleteworkshiftsid) | Delete a workshift by ID |
| GET | [/workshifts/{id}](#getworkshiftsid) | Get a workshift by ID |
| PUT | [/workshifts/{id}](#putworkshiftsid) | Update a workshift by ID |

## Reference Table

| Name | Path | Description |
| --- | --- | --- |
| Workshift | [#/components/schemas/Workshift](#componentsschemasworkshift) |  |
| WorkshiftInput | [#/components/schemas/WorkshiftInput](#componentsschemasworkshiftinput) |  |
| cookieAuth | [#/components/securitySchemes/cookieAuth](#componentssecurityschemescookieauth) |  |

## Path Details

***

### [GET]/workshifts

- Summary  
Get all workshifts

- Security  
cookieAuth  

#### Responses

- 200 Retrieve a list of workshifts

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}[]
```

- 500 Server error

***

### [POST]/workshifts

- Summary  
Create a new workshift

- Security  
cookieAuth  

#### RequestBody

- application/json

```ts
{
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

#### Responses

- 201 Workshift created

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

- 400 Validation error

***

### [GET]/workshifts/doctor/{doctorId}

- Summary  
Get workshifts by doctor ID

- Security  
cookieAuth  

#### Responses

- 200 Lista de workshifts

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}[]
```

- 500 Error del servidor

***

### [POST]/workshifts/week

- Summary  
Create a new workshift for a week

- Security  
cookieAuth  

#### RequestBody

- application/json

```ts
{
  // Unique identifier for the doctor
  doctorId: string
  // Unique identifier for the clinic
  clinicId: string
  // Duration of each work shift in minutes
  duration: integer
  // Start date of the week, must be a Monday
  periodStartDate?: string
  // End date of the week, must be a Sunday within the same week as weekStartDate
  periodEndDate?: string
}
```

#### Responses

- 201 Workshifts created successfully

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}[]
```

- 400 Invalid input or validation error

`application/json`

```ts
{
  // Error message explaining the issue
  message?: string
}
```

***

### [DELETE]/workshifts/{id}

- Summary  
Delete a workshift by ID

- Security  
cookieAuth  

#### Responses

- 204 Workshift deleted

- 404 Workshift not found

- 500 Server error

***

### [GET]/workshifts/{id}

- Summary  
Get a workshift by ID

- Security  
cookieAuth  

#### Responses

- 200 Retrieve a workshift

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

- 404 Workshift not found

- 500 Server error

***

### [PUT]/workshifts/{id}

- Summary  
Update a workshift by ID

- Security  
cookieAuth  

#### RequestBody

- application/json

```ts
{
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

#### Responses

- 200 Workshift updated

`application/json`

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

- 400 Validation error

- 404 Workshift not found

## References

### #/components/schemas/Workshift

```ts
{
  id?: string
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

### #/components/schemas/WorkshiftInput

```ts
{
  doctorId?: string
  clinicId?: string
  startDate?: string
  duration?: integer
}
```

### #/components/securitySchemes/cookieAuth

```ts
{
  "type": "apiKey",
  "in": "cookie",
  "name": "token"
}
```