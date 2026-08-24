USE [cossim];
GO

/* Enable comma-separated source and destination filters in batch/handover lists. */
DECLARE @definition nvarchar(max) = OBJECT_DEFINITION(OBJECT_ID(N'dbo.spHandoverBatchList'));
IF @definition IS NULL THROW 50001, 'dbo.spHandoverBatchList was not found.', 1;

SET @definition = REPLACE(@definition, N'@FromDCCode      NVARCHAR(50)', N'@FromDCCode      NVARCHAR(MAX)');
SET @definition = REPLACE(@definition, N'@ToDCCode        NVARCHAR(50)', N'@ToDCCode        NVARCHAR(MAX)');

/* Both predicates occur twice: once for page rows and once for TotalCount. */
SET @definition = REPLACE(
    @definition,
    N'AND (@FromDCCode = N'''' OR hb.FromDCCode = @FromDCCode)',
    N'AND (NULLIF(@FromDCCode, N'''') IS NULL OR EXISTS
    (
        SELECT 1 FROM STRING_SPLIT(@FromDCCode, N'','') selectedDC
        WHERE LTRIM(RTRIM(selectedDC.value)) = hb.FromDCCode
    ))'
);
SET @definition = REPLACE(
    @definition,
    N'AND (@ToDCCode = N'''' OR hb.ToDCCode = @ToDCCode)',
    N'AND (NULLIF(@ToDCCode, N'''') IS NULL OR EXISTS
    (
        SELECT 1 FROM STRING_SPLIT(@ToDCCode, N'','') selectedDC
        WHERE LTRIM(RTRIM(selectedDC.value)) = hb.ToDCCode
    ))'
);

DECLARE @procedurePosition int = CHARINDEX(N'PROCEDURE', UPPER(@definition));
IF @procedurePosition = 0 THROW 50002, 'The stored procedure definition is invalid.', 1;
SET @definition = N'ALTER ' + SUBSTRING(@definition, @procedurePosition, LEN(@definition));
EXEC sys.sp_executesql @definition;
GO

EXEC dbo.spHandoverBatchList
    @PageNo = 1,
    @PageSize = 100,
    @FromDCCode = N'DC-UB,DC-UAT',
    @ToDCCode = N'DC-US,DC-UM';
GO
