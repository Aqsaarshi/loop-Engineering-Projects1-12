# Project Rules

## General Rules

2. **Check for None before executing**: Before calling any method or function, verify that the object is not None. This prevents the `TypeError: 'NoneType' object has no attribute 'execute'` error seen in the logs.

3. **Never call a method on a value without checking it is not None first.**: Before calling any method or attribute on an object, verify the object is not None. This prevents the `TypeError: 'NoneType' object has no attribute 'execute'` error seen in the logs.

4. **Push only on clean branch**: Ensure the current branch has an upstream tracking branch set, or use `git push --set-upstream` before pushing feature branches.

5. **Document all API changes**: Any new or modified API endpoint must be reflected in the documentation directory within 24 hours of the change.

6. **Run integration tests before deployment**: Always execute the full integration test suite against a staging environment before deploying to production.