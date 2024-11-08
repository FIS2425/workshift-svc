# Workshifts Service

> Version 1.0.0

Workshift management for a personnel administration application. This microservice handles the scheduling, assignment, and modification of employee work shifts, including last-minute adjustments and cancellations.


## Path Table

| Method | Path | Description |
| --- | --- | --- |
| GET | [/workshifts](#getworkshifts) | Get all workshifts |
| POST | [/workshifts](#postworkshifts) | Create a new workshift |
| GET | [/workshifts/availability](#getworkshiftsavailability) | Check workshift availability |
| GET | [/workshifts/doctor/{doctorId}](#getworkshiftsdoctordoctorid) | Get workshifts by doctor ID |
| DELETE | [/workshifts/{id}](#deleteworkshiftsid) | Delete a workshift by ID |
| GET | [/workshifts/{id}](#getworkshiftsid) | Get a workshift by ID |
| PUT | [/workshifts/{id}](#putworkshiftsid) | Update a workshift by ID |

## Reference Table

| Name | Path | Description |
| --- | --- | --- |
| Workshift | [#/components/schemas/Workshift](#componentsschemasworkshift) |  |
| WorkshiftInput | [#/components/schemas/WorkshiftInput](#componentsschemasworkshiftinput) |  |

## Path Details

***

### [GET]/workshifts

- Summary  
Get all workshifts

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

### [GET]/workshifts/availability

- Summary  
Check workshift availability

#### Parameters(Query)

```ts
clinicId: string
```

```ts
date: string
```

#### Responses

- 200 Workshift availability

`application/json`

```ts
{
  available?: boolean
}
```

- 500 Server error

***

### [GET]/workshifts/doctor/{doctorId}

- Summary  
Get workshifts by doctor ID

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

### [DELETE]/workshifts/{id}

- Summary  
Delete a workshift by ID

#### Responses

- 204 Workshift deleted

- 404 Workshift not found

- 500 Server error

***

### [GET]/workshifts/{id}

- Summary  
Get a workshift by ID

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