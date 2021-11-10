# peermaps-node

peermaps node.js command-line tool

# usage

```
usage: peermaps COMMAND ...

  query URI - list all features that intersect BBOX

    URI is a hyper://, ipfs://, or https?:// link to the peermaps dataset
    BBOX is in west,south,east,north form.

    -f FORMAT   - display results in FORMAT: base64 (default), lp
    --bbox=BBOX - list all features that intersect BBOX

    The rows of output are in georender format:
    https://github.com/peermaps/docs/blob/master/georender.md
```

example usage:

```
$ node cmd.js query hyper://3dd1656d6408a718fae1117b5283fb18cb1f9139b892ce0f8cacbb6737ec1d67 \
  -f base64 --bbox=-149.91,61.213,-149.89,61.223 | head -n3
AuUEkt+BHzfy6BXDON50QlTpFcM/3XRCbOkVwx7ddEKG6RXDJt10Qp7pFcMT3XRCpukVwwzddEKs6RXD+tx0QrHpFcPd3HRCsekVw83cdEK66RXDqdx0QsHpFcOc3HRC1ukVw4vcdELN6RXDYNx0QhDqFcPX23RCUeoVw0nbdEKQ6hXDzdp0QsPqFcOG2nRC9OoVw+3ZdEIc6xXDjNl0Qj7rFcNU2XRCa+sVwwzZdEKQ6xXDz9h0Qu3rFcM12HRCXuwVwwnXdEJl7BXDYNZ0QnvsFcMr1nRCsOwVw6PVdEIh7RXDetR0QnntFcPF03RCMe4Vw1zTdEKy7hXDHtN0QuLuFcMH03RCPe8Vw/bSdEKd7xXD5NJ0Qg/wFcOZ0nRCn/EVw1HRdEIi8hXD4tB0QkLzFcNiz3RCmvMVwyPPdEJb9BXDVs50Qmv0FcNPznRCc/UVw9jNdEKi9RXDvM10QvX1FcOgzXRCcPcVw8TMdEJH+BXDIcx0Qqz4FcPly3RCDfkVwybMdEKu+RXDLsx0Qgv6FcPWy3RCFfwVw8bLdELf/hXD1Mx0QvD+FcPmzHRCGv8VwxTNdEL7/xXDGM50QgA=
ApcD7+HSkAUaTeYVw67UdEJM5hXDs9V0QkzmFcPb1XRCTOYVwzfWdEJN5hXDpNZ0Qk3mFcO11nRCTeYVw8fWdEJN5hXDudd0Qk3mFcOp2HRCTeYVw7nYdEJN5hXDzdh0Qk3mFcPW2XRCTOYVw+7ZdEJM5hXDmdp0QkzmFcOg2nRCTOYVw7DadEJM5hXDwNp0QkzmFcMl23RCTOYVwz7bdEJM5hXDwNt0QkzmFcM+3HRCTeYVw8PcdEJN5hXDHt10Qk3mFcM+3XRCTeYVw7TddEJN5hXDxd10Qgk9SSBTdHJlZXQA
AqYD9f+OPxU25BXDGtN0QjbkFcO503RCN+QVw63UdEI25BXDPdV0QjXkFcOI1XRCNOQVw7TVdEI05BXDt9V0QjTkFcNm1nRCNOQVw43WdEI05BXDttZ0QjTkFcMo13RCNeQVw7vXdEI15BXDONh0QjXkFcM/2HRCNOQVw73YdEI15BXDP9l0QjbkFcPA2XRCNuQVw9PZdEI25BXD7Nl0QjfkFcOf2nRCN+QVw7jadEIJPUUgU3RyZWV0AA==
```
