def f(size, characters):
    """
    >>> f(size=4, characters='12345')
    1 2 3 4
     5 1 2
      3 4
       5
       1
      2 3
     4 5 1
    2 3 4 5
    >>> f(size=3, characters='-+')
    - + -
     + -
      +
      -
     + -
    + - +
    >>> f(size=7, characters='A#B')
    A # B A # B A
     # B A # B A
      # B A # B
       A # B A
        # B A
         # B
          A
          #
         B A
        # B A
       # B A #
      B A # B A
     # B A # B A
    # B A # B A #
    """

if __name__ == "__main__":
    import doctest

    doctest.testmod()